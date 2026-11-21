"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, CheckCheck, Cloud, Code2, Database, Globe2, KeyRound, LoaderCircle, LockKeyhole, Network, ScanLine, Server, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { aed, remainingExposure, risks, type RiskId, type RiskState } from "@/lib/demo";

type Props = { riskState: RiskState; selectedRisk: RiskId; onSelect: (id: RiskId) => void; onFix: (id: RiskId) => void };

export default function Topology({ riskState, selectedRisk, onSelect, onFix }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const insightRef = useRef<HTMLDivElement>(null);
  const findingRefs = useRef<Partial<Record<RiskId, HTMLElement | null>>>({});
  const open = Object.values(riskState).filter(s => s !== "secured").length;
  const allSecured = open === 0;
  const graphNodes = [
    { id: "gateway", label: "Open Banking", sub: "External gateway", detail: "External entry point for partner requests, connected to account and KYC services.", icon: Globe2, x: 8, y: 16 },
    { id: "partner", label: "Partner API", sub: "FinTech_Partner_X", icon: KeyRound, x: 38, y: 16, risk: "partner" as RiskId },
    { id: "mobile", label: "Mobile banking", sub: "Customer gateway", detail: "Customer-facing gateway routing requests to payment and KYC services.", icon: Globe2, x: 68, y: 16 },
    { id: "accounts", label: "Accounts service", sub: "12 registered routes", detail: "Registered account routes connect to customer PII and treasury data.", icon: Server, x: 8, y: 46 },
    { id: "shadow", label: "KYC service", sub: "Shadow export detected", icon: Code2, x: 38, y: 46, risk: "shadow" as RiskId },
    { id: "payments", label: "Payment rails", sub: "Wire & SWIFT gateway", detail: "Wire and SWIFT gateway connected to treasury and customer data.", icon: Server, x: 68, y: 46 },
    { id: "pii", label: "Customer PII", sub: "1.84M customer records", detail: "Synthetic customer dataset. Runtime masking and tokenization controls are on the Live SOC tab.", icon: Database, x: 8, y: 76 },
    { id: "bucket", label: "KYC backup", sub: "s3://aegis-kyc-backup", icon: Cloud, x: 38, y: 76, risk: "bucket" as RiskId },
    { id: "treasury", label: "Treasury vault", sub: "84K treasury records", detail: "Synthetic treasury dataset. Runtime vault protections are managed on the Live SOC tab.", icon: Database, x: 68, y: 76 },
  ];
  const selectedNode = graphNodes.find(node => node.id === (selectedAsset ?? selectedRisk))!;
  const selectedFinding = risks.find(risk => risk.id === selectedNode.risk);
  const selectedStatus = selectedNode.risk ? riskState[selectedNode.risk] : "secured";

  function selectRisk(id: RiskId) {
    setSelectedAsset(null);
    onSelect(id);
  }

  function selectNode(node: (typeof graphNodes)[number]) {
    if (node.risk) selectRisk(node.risk);
    else setSelectedAsset(node.id);
    if (window.matchMedia("(max-width: 900px)").matches) {
      const target = node.risk ? findingRefs.current[node.risk] : insightRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return <section className="discovery-grid" aria-label="Shadow data and rogue API discovery">
    <article className="panel topology-panel"><div className="panel-heading"><div className="panel-title"><Network size={17} /><h2>Your bank, mapped.</h2></div><span className="badge green"><i />CONTINUOUS DISCOVERY</span></div><p className="panel-description">Follow the data. Find the gaps. Close them before someone else does.</p><div className="graph-stats"><span><b>9</b> connected assets</span><span><b>12</b> data flows</span><span className={allSecured ? "green-text" : "amber-text"}><TriangleAlert size={13} /><b>{open}</b> security gaps</span><span className="graph-scan"><ScanLine size={13} />Last scan: just now</span></div>
      <div className="graph-scroll"><div className="graph-canvas"><svg className="graph-lines" viewBox="0 0 900 580" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" /></pattern></defs><rect width="900" height="580" fill="url(#dots)" className="graph-dot-pattern" />
        <g className="graph-normal-lines"><path d="M171 145V319M711 145V319M171 319V493M711 319V493M171 145V224H441V319M711 145V207H441V319M171 319V395H711V493M711 319V378H171V493" /></g>
        <g className={`graph-risk-line ${riskState.partner === "secured" ? "secured" : riskState.partner === "fixing" ? "remediating" : ""}`}><path d="M441 145V319M441 145V190H711V319" /></g>
        <g className={`graph-risk-line ${riskState.shadow === "secured" ? "secured" : riskState.shadow === "fixing" ? "remediating" : ""}`}><path d="M441 319V361H171V493" /></g>
        <g className={`graph-risk-line ${riskState.bucket === "secured" ? "secured" : riskState.bucket === "fixing" ? "remediating" : ""}`}><path d="M441 319V493" /></g>
        <circle className="flow-pulse" r="3"><animateMotion dur="5s" repeatCount="indefinite" path="M171 145V319" /></circle><circle className="flow-pulse" r="3"><animateMotion dur="6s" repeatCount="indefinite" path="M711 319V493" /></circle></svg>
        <span className="graph-layer-label layer-1">01 <span>EXTERNAL GATEWAYS</span></span><span className="graph-layer-label layer-2">02 <span>BANK MICROSERVICES</span></span><span className="graph-layer-label layer-3">03 <span>CUSTOMER DATABASES</span></span>
        {graphNodes.map(node => {
          const secured = !node.risk || riskState[node.risk] === "secured";
          const fixing = node.risk && riskState[node.risk] === "fixing";
          const status = fixing ? "FIXING" : secured ? node.risk ? "SECURED" : "NO FINDINGS" : "AT RISK";
          const Icon = node.icon;
          return <button key={node.id} className={`graph-node ${secured ? "secure" : "at-risk"} ${selectedNode.id === node.id ? "focused" : ""} ${fixing ? "remediating" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => selectNode(node)} aria-pressed={selectedNode.id === node.id} aria-label={`${node.label}: ${status.toLowerCase()}, inspect asset`}>
            <span className="graph-node-top"><span className="graph-node-icon"><Icon size={18} /></span><span className={`graph-node-status ${secured ? "" : "warning"}`}>{fixing ? <LoaderCircle size={11} className="spin" /> : secured ? <ShieldCheck size={11} /> : <TriangleAlert size={11} />}{status}</span></span>
            <strong>{node.label}</strong><small>{node.risk && secured ? "Remediation verified" : node.sub}</small>
            {node.risk && !secured && <span className="node-risk-marker">{node.risk === "shadow" ? "01" : node.risk === "partner" ? "02" : "03"}</span>}
          </button>;
        })}
      </div></div><p className="graph-scroll-hint">Scroll horizontally to explore all 9 assets. Select any asset to inspect.</p>
      <div className="graph-legend"><span><i className="legend-line green-line" />Protected data flow</span><span><i className="legend-line red-line" />Exposed data path</span><span><i className="legend-line cyan-line" />Remediating</span><span>Select any asset to inspect</span></div>
      <div className={`graph-insight ${selectedStatus}`} ref={insightRef} aria-live="polite"><span className="insight-icon">{selectedStatus === "fixing" ? <LoaderCircle size={22} className="spin" /> : selectedStatus === "secured" ? <ShieldCheck size={22} /> : <TriangleAlert size={22} />}</span><span>
        <strong>{selectedNode.label} · {selectedFinding ? selectedStatus === "secured" ? "Secured" : selectedStatus === "fixing" ? "Remediating" : `${aed(selectedFinding.exposure)} exposure` : "No discovery findings"}</strong>
        <small>{selectedFinding ? selectedStatus === "secured" ? selectedFinding.fix : selectedStatus === "fixing" ? "Devin is applying the simulated patch. Exposure remains until verification completes." : selectedFinding.description : `${selectedNode.detail} No discovery gap is linked to this asset in this demo scan.`}</small>
        {selectedFinding && <button className="insight-finding" onClick={() => findingRefs.current[selectedFinding.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}>View finding {String(risks.indexOf(selectedFinding) + 1).padStart(2, "0")}<ArrowRight size={12} /></button>}
      </span></div></article>

    <aside className="findings-column">
      <div className={`exposure-card ${allSecured ? "all-secured" : ""}`}>
        <div className="section-caption"><span>{allSecured ? "EXPOSURE ELIMINATED" : "ESTIMATED COMPLIANCE EXPOSURE"}</span>{allSecured ? <ShieldCheck size={16} /> : <TriangleAlert size={16} />}</div>
        <div className="exposure-value" aria-live="polite">{aed(remainingExposure(riskState))}<span>{allSecured ? "No open exposure" : "at risk"}</span></div>
        <p>{allSecured ? "Every discovered security gap has been closed." : `Across ${open} unresolved security gap${open === 1 ? "" : "s"} · synthetic estimate`}</p>
        <div className="exposure-progress"><span style={{ width: `${((risks.length - open) / risks.length) * 100}%` }} /></div><small>{risks.length - open} of {risks.length} findings remediated<ShieldCheck size={12} /></small>
      </div>
      <div className="findings-heading"><h2>Discovered security gaps</h2><span className="badge neutral">{open} OPEN</span></div>
      <div className="finding-list">{risks.map((risk, index) => {
        const status = riskState[risk.id];
        const selected = selectedAsset === null && selectedRisk === risk.id;
        return <article key={risk.id} ref={element => { findingRefs.current[risk.id] = element; }} className={`finding-card ${selected ? "selected" : ""} ${status === "secured" ? "secured" : ""} ${status === "fixing" ? "remediating" : ""}`}>
          <button className="finding-select" onClick={() => selectRisk(risk.id)} aria-expanded={selected} aria-controls={`finding-detail-${risk.id}`}><span className="finding-index">0{index + 1}</span><span className="finding-category">{risk.category}</span><span className={`badge ${status === "secured" ? "green" : status === "fixing" ? "cyan" : risk.severity === "Critical" ? "red" : "amber"}`}>{status === "secured" ? "SECURED" : status === "fixing" ? "FIXING" : risk.severity.toUpperCase()}</span></button>
          <h3>{risk.title}</h3><code className="finding-target">{risk.target}</code><p id={`finding-detail-${risk.id}`} hidden={!selected}>{status === "secured" ? risk.fix : risk.description}</p>
          <div className="finding-exposure"><span>{status === "secured" ? <ShieldCheck size={12} /> : <TriangleAlert size={12} />}{aed(risk.exposure)} {status === "secured" ? "protected" : "exposure"}</span>{selected && <span className="finding-node">{risk.node}</span>}</div>
          <button className={`button fix-button ${status === "secured" ? "complete" : ""}`} disabled={status !== "open"} onClick={() => { selectRisk(risk.id); onFix(risk.id); }}>{status === "fixing" ? <LoaderCircle size={14} className="spin" /> : status === "secured" ? <CheckCheck size={14} /> : <Sparkles size={14} />}{status === "fixing" ? "Devin is remediating…" : status === "secured" ? "Secured · patch verified" : "Auto-Fix with Devin"}{status === "open" && <ArrowRight size={13} />}</button>
          {status === "fixing" && <div className="remediation-progress"><span /></div>}{status === "secured" && selected && <div className="fix-confirmation"><Check size={11} />Code patched · policies verified · node secured</div>}
        </article>;
      })}</div>
      <div className="discovery-note"><LockKeyhole size={12} />All remediations are simulated in this demo.</div>
    </aside>
  </section>;
}
