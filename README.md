# AegisRails

Enterprise Bank API & DSPM Defense — a self-contained, interactive security demonstration.

All customers, traffic, incidents, and code-remediation actions are synthetic. No real banking systems, GitHub patches, or payment rails are connected.

## Run locally

Requires Node.js 20.9 or newer. No credentials, environment variables, or database are required.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production server:

```sh
npm run build
npm start
```

## Five-minute walkthrough

1. Select any of the four data vaults. Toggle PII masking and tokenization to see the partner payload change instantly. Tokenization takes precedence; disabling both intentionally exposes synthetic raw values and reduces the shielded-records KPI.
2. Inspect a live API request to review mTLS, BOLA, IDOR, and velocity checks. Pause or search the live stream; the filter shows blocked requests only.
3. Click **Simulate 02:00 AM Breach**. Watch the compromised partner key attempt a wire and bulk PII export, the 14ms airlock quarantine, and synthetic honeypot response. After remediation appears, inspect demo PR #409 or click **Approve & Merge Devin Patch** to resolve the incident.
4. Switch to **Shadow Data & API Graph**, select flagged nodes, and auto-fix each discovery. The graph, exposure total, and top KPI update together. Fixes take 2.8 seconds and run independently.
5. Open the audit log from the bell or sidebar. **Reset Demo** cancels pending work, restores default controls, clears the audit trail, and restarts the scenario.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Built with Next.js 15 App Router, TypeScript, Tailwind CSS, and Lucide React. State is local to the current browser tab and intentionally resets on page refresh. Telemetry is generated locally every 2.3 seconds and bounded to 60 entries; no runtime external services or fonts are used. API timing labels and threat timestamps are simulated GST scenario values, not wall-clock time.

The initial KPI is the requested **14 / 16** baseline with two known gaps. Opening the graph performs the demo discovery scan, adding one newly discovered risk and updating the shared KPI to **14 / 17**. Each verified fix then advances it to **15 / 17**, **16 / 17**, and **17 / 17**; switching tabs preserves that scope. Reset Demo restores the original baseline. Compliance exposure is a synthetic sum (AED 5.4M + AED 4.1M + AED 3.0M), not a regulatory assessment. Green graph assets mean no discovery finding or a verified remediation, independent of runtime vault controls on Live SOC.

This is a polished product demonstration, not a production enforcement gateway. The displayed patch is illustrative code and the approval button never calls GitHub. PII strings are fabricated; no personal records or genuine secrets are stored.
