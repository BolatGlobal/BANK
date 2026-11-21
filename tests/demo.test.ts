import { test } from "node:test";
import assert from "node:assert/strict";
import { eliminatedCount, initialControls, initialRisks, makeTraffic, payloads, remainingExposure, risks, vaults, visiblePayload } from "../src/lib/demo";

test("external payloads do not leak originals when masking or tokenization is enabled", () => {
  for (const vault of vaults) {
    const raw = payloads[vault.id];
    const masked = visiblePayload(vault.id, { masking: true, tokenization: false });
    const tokenized = visiblePayload(vault.id, { masking: false, tokenization: true });
    const both = visiblePayload(vault.id, { masking: true, tokenization: true });
    raw.forEach((field, index) => {
      assert.notEqual(masked[index].value, field.raw);
      assert.notEqual(tokenized[index].value, field.raw);
      assert.match(tokenized[index].value, /^tok_aegis_/);
    });
    assert.deepEqual(tokenized, both, "tokenization takes precedence over masking");
    assert.deepEqual(visiblePayload(vault.id, { masking: false, tokenization: false }).map(f => f.value), raw.map(f => f.raw));
  }
});

test("each remediation removes only its own exposure and increases the eliminated counter once", () => {
  const state = initialRisks();
  assert.equal(remainingExposure(state), 12500000);
  assert.equal(eliminatedCount(state), 14);
  for (const [index, risk] of risks.entries()) {
    state[risk.id] = "fixing";
    assert.equal(eliminatedCount(state), 14 + index, "in-flight fixes must not count as secured");
    state[risk.id] = "secured";
    assert.equal(eliminatedCount(state), 15 + index);
  }
  assert.equal(remainingExposure(state), 0);
  assert.equal(eliminatedCount(state), 17, "all three findings count, even beyond the original 16-risk baseline");
});

test("fresh default state is isolated and safe for repeat demos", () => {
  const first = initialControls();
  first.customers_pii.masking = false;
  assert.equal(initialControls().customers_pii.masking, true);
  const risksA = initialRisks();
  risksA.bucket = "secured";
  assert.equal(initialRisks().bucket, "open");
});

test("synthetic traffic stays in expected bounds and has unique request IDs", () => {
  const requests = Array.from({ length: 500 }, (_, i) => makeTraffic(i));
  assert.equal(new Set(requests.map(r => r.id)).size, requests.length);
  for (const request of requests) {
    assert.ok(request.latency >= 8 && request.latency <= 24);
    assert.ok(request.risk >= 0 && request.risk <= 100);
    assert.equal(request.status, "ALLOWED");
    assert.match(request.path, /^\/v1\//);
  }
});
