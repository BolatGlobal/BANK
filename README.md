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

The initial KPI is the requested **14 / 16**. There are three additional discovery findings; after all three fixes it becomes **17 / 17** rather than silently dropping or capping a remediation. Compliance exposure is a synthetic sum (AED 5.4M + AED 4.1M + AED 3.0M), not a regulatory assessment.

This is a polished product demonstration, not a production enforcement gateway. The displayed patch is illustrative code and the approval button never calls GitHub. PII strings are fabricated; no personal records or genuine secrets are stored.
