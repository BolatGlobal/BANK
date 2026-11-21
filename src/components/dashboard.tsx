"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Activity, ArrowDown, ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, Braces, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Clock3, Code2, Database, ExternalLink, FileCode2, Fingerprint, GitBranch, GitMerge, GitPullRequest, Globe2, KeyRound, Layers3, ListFilter, LoaderCircle, LockKeyhole, Network, Pause, Play, Radio, RotateCcw, Search, Shield, ShieldCheck, ShieldEllipsis, ShieldOff, Sparkles, TriangleAlert, Wallet, X, Zap } from "lucide-react";
import { eliminatedCount, initialControls, initialRisks, initialTraffic, makeTraffic, payloads, risks, vaults, visiblePayload, type Phase, type RiskId, type RiskState, type Traffic, type VaultId } from "@/lib/demo";
import Topology from "./topology";
import Link from "next/link";
import { createDemoTimers } from "@/lib/demo-timers";

type Modal = "about" | "audit" | "patch" | null;
type AuditEvent = { time: string; title: string; detail: string };

function Badge({ children, tone = "green", dot = false }: { children: ReactNode; tone?: string; dot?: boolean }) {
  return <span className={`badge ${tone}`}>{dot && <i />}{children}</span>;
}

function Toggle({ checked, onChange, label, children }: { checked: boolean; onChange: () => void; label: string; children: ReactNode }) {
  return <button className="policy-row" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}><span>{children}</span><span className={`toggle ${checked ? "on" : ""}`} aria-hidden="true"><span /></span></button>;
}

function Sparkline({ variant = 0 }: { variant?: number }) {
  const paths = ["0,32 12,28 24,31 36,22 48,25 60,18 72,22 84,13 96,17 108,6 120,10", "0,33 12,27 24,29 36,20 48,24 60,14 72,19 84,10 96,13 108,5 120,3", "0,30 16,30 16,24 35,24 35,20 55,20 55,16 78,16 78,8 100,8 100,4 120,4", "0,8 12,15 24,12 36,22 48,16 60,28 72,21 84,30 96,25 108,32 120,30"];
  return <svg className="sparkline" viewBox="0 0 124 40" fill="none" aria-hidden="true"><polyline points={paths[variant]} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M0 39H124" stroke="currentColor" opacity=".13" /></svg>;
}

function CodeDiff({ compact = false }: { compact?: boolean }) {
  return <div className={`code-diff ${compact ? "compact" : ""}`}><div className="diff-file"><FileCode2 size={13} /><span>api/wire/offshore.ts</span><span className="diff-stats">+5 <b>−2</b></span></div><pre><code><span className="diff-context"> export async function transfer(req) {"{"}</span><span className="diff-remove">−  const account = await find(req.account_id);</span><span className="diff-remove">−  return wire(account, req.amount);</span><span className="diff-add">+  const tenant = requireTenant(req.auth);</span><span className="diff-add">+  const account = await find({`{`}</span><span className="diff-add">+    id: req.account_id, tenant_id: tenant.id</span><span className="diff-add">+  {`}`});</span><span className="diff-add">+  return velocityGuard(tenant, () =&gt; wire(account, req.amount));</span><span className="diff-context"> {`}`}</span></code></pre></div>;
}

export default function Dashboard() {
  const [tab, setTab] = useState<"soc" | "graph">("soc");
  const [discoveryScanned, setDiscoveryScanned] = useState(false);
  const [controls, setControls] = useState(initialControls);
  const [selectedVault, setSelectedVault] = useState<VaultId>("customers_pii");
  const [traffic, setTraffic] = useState(initialTraffic);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [phase, setPhase] = useState<Phase>("nominal");
  const [riskState, setRiskState] = useState<RiskState>(initialRisks);
  const [selectedRisk, setSelectedRisk] = useState<RiskId>("shadow");
  const [inspection, setInspection] = useState<Traffic | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([{ time: "14:32:18", title: "All protection policies synchronized", detail: "Four vaults protected · API gateway healthy · mTLS enforced" }]);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [timers] = useState(createDemoTimers);
  const sequence = useRef(15);
  const feedRef = useRef<HTMLDivElement>(null);
  const feedAnchor = useRef<{ id: string; top: number } | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const phaseBusy = phase === "detected" || phase === "airlock" || phase === "patch";
  const protectedRecords = vaults.reduce((sum, v) => sum + (controls[v.id].masking || controls[v.id].tokenization ? v.records : 0), 0);
  const log = useCallback((title: string, detail: string, time = "14:32:18") => setAudit(events => [{ time, title, detail }, ...events].slice(0, 80)), []);

  useEffect(() => {
    if (paused || inspection) return;
    const timer = setInterval(() => {
      // Keep keyboard targets stable, and anchor older requests across prepends/pruning.
      if (feedRef.current?.contains(document.activeElement)) return;
      const feed = feedRef.current;
      const anchor = feed && feed.scrollTop > 0
        ? Array.from(feed.querySelectorAll<HTMLElement>("[data-request-id]")).find(row => row.getBoundingClientRect().bottom > feed.getBoundingClientRect().top)
        : null;
      feedAnchor.current = anchor ? { id: anchor.dataset.requestId!, top: anchor.getBoundingClientRect().top } : null;
      const next = makeTraffic(sequence.current++);
      setTraffic(rows => [next, ...rows].slice(0, 60));
    }, 2300);
    return () => clearInterval(timer);
  }, [paused, inspection]);

  useLayoutEffect(() => {
    const anchor = feedAnchor.current;
    feedAnchor.current = null;
    const feed = feedRef.current;
    const row = anchor && feed?.querySelector<HTMLElement>(`[data-request-id="${anchor.id}"]`);
    if (feed && row && anchor) feed.scrollTop += row.getBoundingClientRect().top - anchor.top;
  }, [traffic]);

  useEffect(() => () => timers.clear(), [timers]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!inspection && !modal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setInspection(null); setModal(null); }
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", close);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, [inspection, modal]);

  function simulate() {
    if (phaseBusy) return;
    setTab("soc");
    setPhase("detected");
    setPaused(false);
    setBlockedOnly(false);
    setQuery("");
    const attack: Traffic = { id: sequence.current++, time: "02:00:03", method: "POST", path: "/v1/wire/offshore", partner: "FinTech_Partner_X", latency: 14, risk: 99, status: "BLOCKED", attack: true };
    const exportAttack: Traffic = { ...attack, id: sequence.current++, method: "GET", path: "/v1/customers/export?limit=50000" };
    setTraffic(rows => [attack, exportAttack, ...rows].slice(0, 60));
    log("Threat detected · simulated 99.8% confidence", "Compromised partner credential attempted cross-tenant access. Attempted AED 450,000 offshore wire and 50,000-record PII export.", "02:00:03");
    timers.schedule(() => {
      setPhase("airlock");
      log("Airlock engaged in 14ms (simulated)", "AED 450,000 quarantined. Partner token revoked. Synthetic honeypot PII returned; real customer data shielded.", "02:00:03.014");
    }, 1800);
    timers.schedule(() => {
      setPhase("patch");
      log("Devin remediation ready · PR #409", "Tenant isolation and wire velocity checks generated. Awaiting simulated approval.", "02:00:05");
    }, 4200);
  }

  function mergePatch() {
    if (phase !== "patch") return;
    setPhase("resolved");
    setModal(null);
    setToast({ message: "Patch merged. Banking rails restored to PROTECTED." });
    log("PR #409 approved & merged (demo)", "BOLA fixed, strict tenant_id enforced, velocity limits active. No funds or real records lost.", "02:00:37");
  }

  function fixRisk(id: RiskId) {
    if (riskState[id] !== "open") return;
    setRiskState(current => ({ ...current, [id]: "fixing" }));
    log("Devin remediation started", risks.find(r => r.id === id)!.title);
    timers.schedule(() => {
      setRiskState(current => ({ ...current, [id]: "secured" }));
      log("Security gap remediated", risks.find(r => r.id === id)!.fix);
      setToast({ message: "Remediation verified. Exposure and risk counters updated." });
    }, 2800);
  }

  function reset() {
    setDiscoveryScanned(false);
    timers.clear();
    setControls(initialControls()); setSelectedVault("customers_pii"); setTraffic(initialTraffic()); setPaused(false); setQuery(""); setBlockedOnly(false); setPhase("nominal"); setRiskState(initialRisks()); setSelectedRisk("shadow"); setInspection(null); setModal(null); setTab("soc"); sequence.current = 15;
    setAudit([{ time: "14:32:18", title: "Demo reset · all systems nominal", detail: "Default masking restored. Synthetic traffic restarted. Discovery findings reopened." }]);
    setToast({ message: "Demo reset. Ready for your next walkthrough." });
  }

  const filteredTraffic = traffic.filter(row => (!blockedOnly || row.status === "BLOCKED") && `${row.path} ${row.partner} ${row.method}`.toLowerCase().includes(query.toLowerCase()));
  const control = controls[selectedVault];
  const activeThreat = phaseBusy;
  const openFindings = Object.values(riskState).filter(status => status !== "secured").length;
  const trackedRisks = discoveryScanned ? 14 + risks.length : 16;

  function selectTab(next: "soc" | "graph") {
    setTab(next);
    if (next === "graph") setDiscoveryScanned(true);
  }

  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" href="/" aria-label="AegisRails home"><span className="brand-mark"><ShieldCheck size={26} strokeWidth={1.7} /></span><span>Aegis<span className="brand-light">Rails</span><small>Enterprise Bank API & DSPM Defense</small></span></Link>
      <div className="topbar-right"><span className="environment"><span className="live-dot" />PRODUCTION SANDBOX<ChevronDown size={12} /></span><span className="topbar-divider" /><button className="icon-button notification" aria-label="Open audit log" onClick={() => setModal("audit")}><Bell size={18} /><i /></button><button className="avatar" onClick={() => setModal("about")} aria-label="About the bank workspace">BA</button></div>
    </header>

    <aside className="side-rail" aria-label="Workspace navigation"><div className="rail-main"><button title="Live SOC & API Airlock" aria-label="Live SOC & API Airlock" className={tab === "soc" ? "active" : ""} onClick={() => selectTab("soc")}><ShieldEllipsis size={21} /></button><button title="Shadow Data & API Graph" aria-label="Shadow Data & API Graph" className={tab === "graph" ? "active" : ""} onClick={() => selectTab("graph")}><Network size={21} /></button><button title="Audit log" aria-label="Audit log" onClick={() => setModal("audit")}><Layers3 size={21} /></button></div><div className="rail-bottom"><button title="About this demo" aria-label="About this demo" onClick={() => setModal("about")}><CircleHelp size={21} /></button><span className="rail-avatar">B</span></div></aside>

    <main className="workspace">
      <section className="page-heading"><div><div className="eyebrow">SECURITY OPERATIONS <ChevronRight size={11} /> COMMAND CENTER</div><h1>Your perimeter. <span>Under control.</span></h1><p>Discover exposed data, contain API abuse, and review a code fix. Synthetic data · no bank connections.</p></div><div className="heading-actions"><button className="button subtle" onClick={reset}><RotateCcw size={14} />Reset Demo</button><button className="button danger" onClick={simulate} disabled={phaseBusy}><Zap size={15} fill="currentColor" />{phaseBusy ? "Breach simulation active" : "Simulate 02:00 AM Breach"}</button></div></section>

      <div className="view-bar"><nav className="view-tabs" aria-label="Command center views"><button className={tab === "soc" ? "selected" : ""} onClick={() => selectTab("soc")}><Radio size={16} /><span className="tab-number">1.</span> Live SOC & API Airlock</button><button className={tab === "graph" ? "selected" : ""} onClick={() => selectTab("graph")}><Network size={16} /><span className="tab-number">2.</span> Shadow Data & API Graph<em aria-label={`${openFindings} unresolved findings`}>{openFindings}</em></button></nav><span className="workspace-status"><span className={`live-dot ${activeThreat ? "red-dot" : ""}`} />{phase === "detected" ? "Request blocked · containing" : phase === "patch" ? "Incident contained · patch ready" : activeThreat ? "Incident contained · investigating" : phase === "resolved" ? "Incident resolved · demo" : "Demo controls active"}<span className="region">UAE NORTH</span></span></div>

      <section className="kpi-grid" aria-label="Live banking protection metrics">
        <article className="kpi"><div className="kpi-label"><Wallet size={14} />Protected Banking Assets<ShieldCheck size={13} className="kpi-corner" /></div><div className="kpi-value">$1.42<span>B</span><Sparkline /></div><div className="kpi-note"><span><ArrowUpRight size={12} />Synthetic portfolio</span><small>no real funds connected</small></div></article>
        <article className="kpi"><div className="kpi-label"><Fingerprint size={14} />Sensitive Records Shielded</div><div className={`kpi-value ${protectedRecords < 2480910 ? "warning-text" : ""}`}>{protectedRecords.toLocaleString("en-US")}<Sparkline variant={1} /></div><div className="kpi-note"><span><LockKeyhole size={11} />{protectedRecords === 2480910 ? "Demo policies active" : "Protection policies changed"}</span><small>real-time masking</small></div></article>
        <article className="kpi"><div className="kpi-label"><Network size={14} />Shadow APIs / Risks Eliminated</div><div className="kpi-value">{eliminatedCount(riskState)}<span className="kpi-denominator"> / {trackedRisks}</span><Sparkline variant={2} /></div><div className="kpi-note"><span className={openFindings === 0 ? "" : "amber-text"}><span className="tiny-dot" />{discoveryScanned ? `${openFindings} findings to review` : "2 known gaps"}</span><small>{discoveryScanned ? "1 new risk discovered" : "graph scan available"}</small></div></article>
        <article className="kpi"><div className="kpi-label"><GitPullRequest size={14} />Mean Time to Patch (Devin AI)</div><div className="kpi-value">34<span className="kpi-unit">sec</span><Sparkline variant={3} /></div><div className="kpi-note"><span><ArrowDownLeft size={12} />Scenario value</span><small>not a benchmark</small></div></article>
      </section>

      {tab === "soc" ? <section className="soc-grid" aria-label="Live security operations center">
        <article className="panel vault-panel"><div className="panel-heading"><div className="panel-title"><Database size={17} /><h2>Data vault</h2></div><Badge tone="neutral">DSPM</Badge></div><p className="panel-description">Sensitive data. Always under your control.</p><div className="vault-list" role="group" aria-label="Bank database tables">{vaults.map(v => <button key={v.id} onClick={() => setSelectedVault(v.id)} aria-pressed={selectedVault === v.id} aria-controls="vault-payload" className={`vault-row ${selectedVault === v.id ? "selected" : ""}`}><span className={`vault-icon ${controls[v.id].masking || controls[v.id].tokenization ? "" : "unprotected"}`}><Database size={16} /></span><span><strong>{v.id}</strong><small>{v.fields}</small></span>{controls[v.id].masking || controls[v.id].tokenization ? <ShieldCheck size={15} className="green-text vault-status" /> : <ShieldOff size={15} className="red-text vault-status" />}</button>)}</div><div className="policy-section"><div className="section-caption">PROTECTION POLICIES<Badge tone="neutral">LIVE</Badge></div><Toggle checked={control.masking} label={`Dynamic PII Masking for ${selectedVault}`} onChange={() => { setControls(c => ({ ...c, [selectedVault]: { ...c[selectedVault], masking: !c[selectedVault].masking } })); log(`PII masking ${control.masking ? "disabled" : "enabled"}`, selectedVault); }}><LockKeyhole size={14} />Dynamic PII Masking</Toggle><Toggle checked={control.tokenization} label={`Zero-Trust Tokenization for ${selectedVault}`} onChange={() => { setControls(c => ({ ...c, [selectedVault]: { ...c[selectedVault], tokenization: !c[selectedVault].tokenization } })); log(`Tokenization ${control.tokenization ? "disabled" : "enabled"}`, selectedVault); }}><KeyRound size={14} />Zero-Trust Tokenization</Toggle></div><div className="payload-section" id="vault-payload" role="region" aria-label="Payload preview"><span className="sr-only" role="status" aria-atomic="true">{selectedVault}: partner payload {control.tokenization ? "tokenized" : control.masking ? "masked" : "unprotected, raw demo data exposed"}.</span><div className="section-caption">LIVE PAYLOAD PREVIEW<Braces size={13} /></div><div className="payload-route"><span className="tiny-dot" />External partner API query<ArrowDown size={12} /></div><div className="payload-code"><div className="payload-label">SOURCE · SYNTHETIC DATA</div>{payloads[selectedVault].slice(0, 2).map(field => <div className="payload-field" key={field.key}><span>{field.key}</span><code>{field.raw}</code></div>)}</div><div className="transform-label"><span /><LockKeyhole size={11} />{control.tokenization ? "TOKENIZATION LAYER" : control.masking ? "AEGIS MASKING LAYER" : "PROTECTION DISABLED"}<span /></div><div className={`payload-code output ${!control.masking && !control.tokenization ? "exposed" : ""}`}><div className="payload-label">PARTNER RECEIVES <Badge tone={control.masking || control.tokenization ? "green" : "red"}>{control.tokenization ? "TOKENIZED" : control.masking ? "MASKED" : "RAW DATA"}</Badge></div>{visiblePayload(selectedVault, control).slice(0, 2).map(field => <div className="payload-field" key={field.key}><span>{field.key}</span><code>{field.value}</code></div>)}</div><div className="vault-footnote"><ShieldCheck size={12} />{control.tokenization ? "Demo tokens stand in for sensitive values" : control.masking ? "Selected fields masked in this demo payload" : "Warning: partner queries expose raw demo data"}</div></div></article>

        <article className="panel traffic-panel"><div className="panel-heading"><div className="panel-title"><Activity size={17} /><h2>Banking API traffic</h2></div><Badge dot>LIVE</Badge></div><p className="panel-description">Illustrative UAE ecosystem traffic · no partner integrations.</p><div className="traffic-summary"><div><strong>1,284</strong><span>demo req / min</span></div><div className="latency-summary"><span className="live-dot" /><strong>14<span>ms</span></strong><small>simulated latency</small></div><div className="traffic-bars" aria-hidden="true">{[30, 55, 38, 70, 45, 80, 60, 90, 52, 68, 85, 57, 92, 64, 76, 48, 88, 68, 94, 73, 58, 84, 65, 92, 72].map((height, i) => <i key={i} style={{ height: `${height}%`, animationDelay: `${i * 70}ms` }} />)}</div></div><div className="traffic-toolbar"><label className="search"><Search size={13} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search endpoints or partners…" aria-label="Search API traffic" /></label><button className={`small-icon ${blockedOnly ? "selected" : ""}`} title={blockedOnly ? "Show all requests" : "Show blocked requests only"} aria-label={blockedOnly ? "Show all requests" : "Show blocked requests only"} aria-pressed={blockedOnly} onClick={() => setBlockedOnly(v => !v)}><ListFilter size={15} /></button><button className="small-icon" title={paused ? "Resume traffic" : "Pause traffic"} aria-label={paused ? "Resume traffic" : "Pause traffic"} onClick={() => setPaused(v => !v)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button></div><div className="stream-head"><span>ENDPOINT / PARTNER</span><span>RISK</span><span>STATUS</span></div><div className="traffic-feed" ref={feedRef} aria-label="API request stream">{filteredTraffic.length ? filteredTraffic.map(row => <button key={row.id} data-request-id={row.id} className={`traffic-row ${row.attack ? "attack-row" : ""}`} aria-haspopup="dialog" aria-label={`Inspect ${row.method} ${row.path}, ${row.partner}, ${row.time} GST, latency ${row.latency} milliseconds, risk ${row.risk} out of 100, ${row.status}`} onClick={() => setInspection(row)}><span className="request-info"><span className="request-top"><span className={`method ${row.method.toLowerCase()}`}>{row.method}</span><code>{row.path}</code></span><span className="request-sub"><span>{row.partner}</span><span>·</span><span>{row.time}</span><span>·</span><span>{row.latency}ms</span></span></span><span className={`risk-score ${row.risk > 70 ? "high" : ""}`}><i />{row.risk}</span><Badge tone={row.status === "BLOCKED" ? "red" : "green"}>{row.status}</Badge></button>) : <div className="empty-feed"><Search size={24} /><strong>No matching requests</strong><span>{blockedOnly ? "No blocked requests yet. Run a breach simulation." : "Try a different endpoint or partner name."}</span></div>}</div><div className="panel-bottom"><span><LockKeyhole size={11} />mTLS enforced<span className="separator-dot">·</span>BOLA / IDOR checks active</span><span>{paused ? "PAUSED" : "STREAMING"}<span className={`tiny-dot ${paused ? "muted-dot" : ""}`} /></span></div></article>

        <article className={`panel response-panel ${activeThreat ? "incident-active" : ""}`}><div className="panel-heading"><div className="panel-title"><Sparkles size={17} /><h2>Autonomous response</h2></div><span className="devin-label"><span className="devin-symbol">d</span>Devin</span></div><p className="panel-description">From threat to patch. Without the handoffs.</p>
          {phase === "nominal" ? <><div className="nominal-visual"><div className="radar-ring ring-three" /><div className="radar-ring ring-two" /><div className="radar-ring ring-one" /><div className="shield-core"><ShieldCheck size={45} strokeWidth={1.3} /></div><span className="radar-node node-one" /><span className="radar-node node-two" /><span className="radar-node node-three" /></div><div className="nominal-copy"><Badge dot>PROTECTED</Badge><h3>Monitor threats.<br />Contain API abuse.</h3><p>Runtime controls active in this demo.<br />Review discovered data risks in the graph.</p></div><div className="defense-checks"><div><Check size={13} />API authorization verified<span>Active</span></div><div><Check size={13} />Sensitive data shielded<span>Active</span></div><div><Check size={13} />Devin auto-patcher ready<span>Standby</span></div></div><div className="simulation-hint"><Zap size={17} /><span><strong>See your defense in action</strong><small>Simulate a 02:00 breach to watch AegisRails detect, contain, and remediate.</small></span><ArrowUpRight size={15} /></div></> : <div className="incident-content" aria-live="polite"><div className={`incident-banner ${phase === "resolved" ? "resolved" : ""}`}><span className="incident-icon">{phase === "resolved" ? <ShieldCheck size={22} /> : <TriangleAlert size={22} />}</span><div><strong>{phase === "resolved" ? "Threat resolved. Rails protected." : phase === "detected" ? "02:00 account-drain attempt blocked" : "02:00 account-drain attempt contained"}</strong><span>{phase === "resolved" ? "AED 450,000 demo transfer blocked" : "FinTech_Partner_X · Open Banking API"}</span></div><Badge tone={phase === "resolved" ? "green" : "red"}>{phase === "resolved" ? "PROTECTED" : "CRITICAL"}</Badge></div><div className="incident-timeline"><div className="timeline-item threat"><span className="timeline-icon"><TriangleAlert size={13} /></span><div className="timeline-meta"><time>02:00:03 AM</time><Badge tone="red">SIMULATED · 99.8%</Badge></div><h4>Threat detected · request blocked</h4><p>Compromised partner credential attempted cross-tenant access.</p><div className="attack-details"><code>POST /v1/wire/offshore</code><strong>−AED 450,000 <small>→ unapproved overseas beneficiary</small></strong><code>SELECT * FROM customers_pii LIMIT 50000</code></div></div><div className={`timeline-item ${phase === "detected" ? "pending" : ""}`}><span className="timeline-icon"><LockKeyhole size={13} /></span><div className="timeline-meta"><time>02:00:03.014 AM</time><span className="green-text">14ms · simulated</span></div><h4>Airlock engaged</h4>{phase !== "detected" ? <><p>Wire quarantined. Partner token revoked.</p><div className="honeypot"><ShieldCheck size={14} /><span>Synthetic Honeypot PII delivered<small>50,000 decoy records in this simulation.</small></span></div></> : <p>Completing quarantine and token revocation…</p>}</div><div className={`timeline-item ${phase === "detected" || phase === "airlock" ? "pending" : ""}`}><span className="timeline-icon"><Code2 size={13} /></span><div className="timeline-meta"><time>02:00:05 AM</time><span className="devin-label">Devin AI</span></div><h4>{phase === "resolved" ? "Code vulnerability remediated" : "Autonomous remediation"}</h4>{phase === "patch" || phase === "resolved" ? <div className="patch-card"><button className="patch-heading" onClick={() => setModal("patch")}><GitPullRequest size={16} /><span>PR #409 <ExternalLink size={11} /><strong>Fix BOLA & enforce strict tenant_id + velocity limit on /v1/wire/offshore</strong></span></button><CodeDiff compact />{phase === "resolved" ? <div className="merged-state"><GitMerge size={14} />Merged · protections verified</div> : <button className="button primary merge-button" onClick={mergePatch}><GitMerge size={14} />Approve & Merge Devin Patch</button>}<small className="demo-merge-note">Simulated PR · no GitHub changes</small></div> : <p className="working-line"><LoaderCircle size={12} className="spin" />{phase === "airlock" ? "Devin is generating a secure patch…" : "Waiting for containment…"}</p>}</div></div></div>}
          <div className="response-footer"><span className="tiny-dot" />{phase === "resolved" ? "Incident closed · audit trail preserved" : activeThreat ? "Autonomous defense sequence in progress" : "Automated containment. Reviewed remediation."}</div></article>
      </section> : <Topology riskState={riskState} selectedRisk={selectedRisk} onSelect={setSelectedRisk} onFix={fixRisk} />}

      <footer className="workspace-footer"><span><span className="live-dot" />AegisRails engine v2.4.0<span className="footer-divider">/</span><Globe2 size={11} />Dubai, UAE<span className="footer-divider">/</span><Clock3 size={11} />Telemetry refreshes every 2.3s</span><span className="demo-indicator">DEMO WORKSPACE<span className="footer-divider">·</span>Synthetic data only<a href="https://app.devin.ai/sessions/0c85edfad5de442f864f456d4dee8424" target="_blank" rel="noreferrer" title="Request changes"><ExternalLink size={11} /></a></span></footer>
    </main>

    {(inspection || modal) && <div className="modal-backdrop" onClick={() => { setInspection(null); setModal(null); }}><section ref={dialogRef} className={`dialog ${inspection ? "inspection-drawer" : ""} ${modal === "audit" ? "audit-dialog" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e => e.stopPropagation()}><div className="dialog-header"><span><span className="eyebrow">AEGISRAILS / {inspection ? "REQUEST INSPECTOR" : modal === "audit" ? "AUDIT TRAIL" : modal === "patch" ? "AUTONOMOUS PATCH" : "WORKSPACE"}</span><h2 id="dialog-title">{inspection ? "Request inspection" : modal === "audit" ? "Every action, accounted for." : modal === "patch" ? "Devin Pull Request #409" : "Defense without blind spots."}</h2></span><button className="icon-button" aria-label="Close dialog" onClick={() => { setInspection(null); setModal(null); }}><X size={20} /></button></div>
      {inspection ? <><div className="inspect-endpoint"><span className={`method ${inspection.method.toLowerCase()}`}>{inspection.method}</span><code>{inspection.path}</code><Badge tone={inspection.attack ? "red" : "green"}>{inspection.status}</Badge></div><dl className="inspect-metrics"><div><dt>Partner</dt><dd>{inspection.partner}</dd></div><div><dt>Risk score</dt><dd className={inspection.attack ? "red-text" : "green-text"}>{inspection.risk} / 100</dd></div><div><dt>Inspection latency</dt><dd>{inspection.latency} ms</dd></div><div><dt>Scenario time (GST)</dt><dd>{inspection.time}</dd></div></dl><div className="section-caption">ZERO-TRUST VERIFICATION</div>{[{ title: "mTLS certificate", detail: "Partner certificate chain validated", pass: true }, { title: "Object-level authorization (BOLA)", detail: inspection.attack ? "Cross-tenant account access rejected" : "Resource belongs to authenticated tenant", pass: !inspection.attack }, { title: "Object reference checks (IDOR)", detail: inspection.attack ? "Unauthorized object reference blocked" : "Object-level authorization passed", pass: !inspection.attack }, { title: "Velocity & behavior", detail: inspection.attack ? "Bulk export + anomalous offshore transfer" : "Within partner baseline and rate limits", pass: !inspection.attack }].map(check => <div className={`inspection-check ${check.pass ? "" : "failed"}`} key={check.title}>{check.pass ? <ShieldCheck size={19} /> : <ShieldOff size={19} />}<span><strong>{check.title}</strong><small>{check.detail}</small></span><Badge tone={check.pass ? "green" : "red"}>{check.pass ? "PASSED" : "BLOCKED"}</Badge></div>)}<div className="inspect-verdict"><Shield size={18} /><span>{inspection.attack ? "Request blocked by object-level policy. See the incident timeline for quarantine, token revocation, and synthetic honeypot response." : "Request allowed. Active vault policies are applied before the partner receives data."}</span></div><div className="drawer-footnote">Request ID: aegis_req_{String(inspection.id).padStart(8, "0")}<br />This is simulated telemetry, not a real network request.</div></> : modal === "audit" ? <><p className="dialog-description">A local, session-scoped record of policies, incidents, and remediations.</p><div className="audit-events">{audit.map((event, index) => <article key={`${event.title}-${index}`}><span className="audit-event-dot" /><time>{event.time}</time><h3>{event.title}</h3><p>{event.detail}</p></article>)}</div><div className="drawer-footnote">{audit.length} recorded event{audit.length === 1 ? "" : "s"} · Reset Demo clears this audit trail.</div></> : modal === "patch" ? <><Badge tone={phase === "resolved" ? "green" : "cyan"}>{phase === "resolved" ? "MERGED" : "READY FOR APPROVAL"}</Badge><h3 className="patch-modal-title">Fix BOLA & enforce strict tenant_id + velocity limit on /v1/wire/offshore</h3><p className="dialog-description">Devin adds object-level tenant checks and velocity enforcement to the vulnerable wire handler.</p><div className="patch-branch"><GitBranch size={14} /><code>devin/fix-offshore-bola</code><ArrowRight size={13} /><code>main</code></div><CodeDiff /><div className="patch-checks"><CheckCheck size={16} />Authorization checks · tenant isolation · velocity limits</div>{phase === "patch" && <button className="button primary" onClick={mergePatch}><GitMerge size={15} />Approve & Merge Devin Patch</button>}<p className="drawer-footnote">Demonstration code diff. This action does not create or merge a real GitHub PR.</p></> : <><div className="about-logo"><ShieldCheck size={36} /><span>AegisRails</span></div><p className="about-lead">Enterprise Bank API & DSPM Defense</p><p className="dialog-description">A unified CISO command center combining proactive shadow-data discovery with active runtime defense for Open Banking APIs and payment rails. In the UAE, Open Banking is part of the broader Open Finance framework.</p><div className="about-features"><span><Network size={18} />Discover hidden APIs and exposed data</span><span><ShieldCheck size={18} />Mask PII and contain suspicious transfers</span><span><Sparkles size={18} />Preview autonomous Devin remediation</span></div><div className="demo-disclaimer"><TriangleAlert size={18} /><span><strong>Interactive demo, not a connected security product.</strong>All records, traffic, risk estimates, and remediation actions are synthetic. State resets on refresh. No actual bank systems, funds, partner credentials, or GitHub operations are connected.</span></div><Badge tone="neutral">TRACK 2 · CODE, DATA & INFRA RAILS</Badge></>}
    </section></div>}
    {toast && <div className="toast" role="status"><Check size={17} />{toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={14} /></button></div>}
  </div>;
}
