export type Phase = "nominal" | "detected" | "airlock" | "patch" | "resolved";
export type Control = { masking: boolean; tokenization: boolean };
export type Traffic = { id: number; time: string; method: "GET" | "POST"; path: string; partner: string; latency: number; risk: number; status: "ALLOWED" | "BLOCKED"; attack?: boolean };

export const vaults = [
  { id: "customers_pii", fields: "Emirates ID, IBAN, Phone", records: 1842910, label: "Customer records" },
  { id: "kyc_biometrics", fields: "FaceID hashes, Video KYC", records: 426000, label: "Biometric identities" },
  { id: "corporate_treasury", fields: "SWIFT codes, Wire keys", records: 84000, label: "Treasury credentials" },
  { id: "partner_api_tokens", fields: "API keys, OAuth tokens", records: 128000, label: "Partner credentials" },
] as const;
export type VaultId = (typeof vaults)[number]["id"];
export const initialControls = (): Record<VaultId, Control> => Object.fromEntries(vaults.map(v => [v.id, { masking: true, tokenization: false }])) as Record<VaultId, Control>;

export const payloads: Record<VaultId, { key: string; raw: string; masked: string }[]> = {
  customers_pii: [
    { key: "emirates_id", raw: "784-1995-4829104-1", masked: "784-****-*******-1" },
    { key: "iban", raw: "AE07 0331 2345 6789 0123 456", masked: "AE07 **** **** **** **** 456" },
    { key: "phone", raw: "+971 50 123 4567", masked: "+971 ** *** 4567" },
  ],
  kyc_biometrics: [
    { key: "face_id_hash", raw: "face_demo_8fa4c291d0", masked: "face_************" },
    { key: "video_kyc", raw: "kyc/demo/customer_0291.mp4", masked: "kyc/****/********.mp4" },
    { key: "verification", raw: "verified_customer_0291", masked: "verified_********" },
  ],
  corporate_treasury: [
    { key: "swift_code", raw: "EBILAEADXXX", masked: "EBIL****XXX" },
    { key: "wire_key", raw: "demo_wire_treasury_0192", masked: "demo_wire_********" },
    { key: "account", raw: "CORP-TREASURY-920184", masked: "CORP-********-****84" },
  ],
  partner_api_tokens: [
    { key: "partner", raw: "FinTech_Partner_X", masked: "FinTech_********" },
    { key: "api_token", raw: "demo_partner_key_7821", masked: "demo_************7821" },
    { key: "oauth_scope", raw: "accounts:read wires:write", masked: "accounts:read [restricted]" },
  ],
};

export function visiblePayload(id: VaultId, control: Control) {
  return payloads[id].map((field, index) => ({ key: field.key, value: control.tokenization ? `tok_aegis_${id.slice(0, 3)}_${String(index + 1).padStart(4, "0")}` : control.masking ? field.masked : field.raw }));
}

const routes = [
  { method: "GET", path: "/v1/accounts/balance", partner: "Emirates NBD" },
  { method: "POST", path: "/v1/kyc/verify", partner: "UAE PASS" },
  { method: "GET", path: "/v1/open-banking/transactions", partner: "Lean Technologies" },
  { method: "POST", path: "/v1/wire/cross-border", partner: "FAB Connect" },
  { method: "GET", path: "/v1/accounts/balance", partner: "Wio Business" },
  { method: "POST", path: "/v1/payments/instant", partner: "Mashreq Neo" },
] as const;

export function makeTraffic(id: number): Traffic {
  const route = routes[id % routes.length];
  const seconds = (18 + id * 2) % 60;
  return { ...route, id, time: `14:32:${String(seconds).padStart(2, "0")}`, latency: 8 + (id * 7) % 17, risk: 2 + (id * 3) % 17, status: "ALLOWED" };
}

export const initialTraffic = () => Array.from({ length: 14 }, (_, i) => makeTraffic(14 - i));

export const risks = [
  { id: "shadow", title: "Undocumented KYC endpoint", category: "SHADOW API", severity: "Critical", target: "/api/internal/v1/kyc-export", description: "An unregistered export route exposes unencrypted customer PII outside the API gateway.", exposure: 5400000, fix: "Register route, enforce tenant authorization, and redact PII.", node: "KYC service", icon: "api" },
  { id: "partner", title: "Over-privileged partner token", category: "EXCESSIVE ACCESS", severity: "High", target: "FinTech_Partner_X", description: "A partner credential has unrestricted read access and cross-tenant wire permissions.", exposure: 4100000, fix: "Rotate credential and constrain scopes to approved tenants.", node: "Partner API", icon: "key" },
  { id: "bucket", title: "Unmasked KYC backup bucket", category: "DATA EXPOSURE", severity: "High", target: "s3://aegis-kyc-backup", description: "Biometric backups are readable without field-level encryption or a private access policy.", exposure: 3000000, fix: "Enforce private access, encryption, and automated PII masking.", node: "KYC backup", icon: "bucket" },
] as const;
export type RiskId = (typeof risks)[number]["id"];
export type RiskStatus = "open" | "fixing" | "secured";
export type RiskState = Record<RiskId, RiskStatus>;
export const initialRisks = (): RiskState => ({ shadow: "open", partner: "open", bucket: "open" });
export function eliminatedCount(state: RiskState) { return 14 + Object.values(state).filter(v => v === "secured").length; }
// Preserve the requested opening snapshot; the first remediation reconciles
// its inventory with all three findings from continuous discovery.
export function discoveredRiskTotal(state: RiskState) { return Object.values(state).every(v => v === "open") ? 16 : 14 + risks.length; }
export function remainingExposure(state: RiskState) { return risks.reduce((sum, risk) => sum + (state[risk.id] === "secured" ? 0 : risk.exposure), 0); }
export const aed = (value: number) => value === 0 ? "AED 0" : `AED ${(value / 1000000).toFixed(1)}M`;
