import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoTimers } from "../src/lib/demo-timers";

test("completed breach and remediation timers are released on every replay", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const timers = createDemoTimers();
  let completed = 0;

  for (let replay = 0; replay < 1000; replay++) {
    for (const delay of [1800, 2800, 4200]) {
      timers.schedule(() => { completed++; }, delay);
    }
    assert.equal(timers.size, 3);
    t.mock.timers.tick(1800);
    assert.equal(timers.size, 2);
    t.mock.timers.tick(2400);
    assert.equal(timers.size, 0, "no completed handles survive into the next replay");
  }

  assert.equal(completed, 3000);
});

test("reset cancels concurrent work without cancelling a subsequent scenario", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const timers = createDemoTimers();
  const events: string[] = [];
  timers.schedule(() => events.push("airlock"), 1800);
  timers.schedule(() => events.push("old fix"), 2800);
  timers.schedule(() => events.push("old patch"), 4200);
  t.mock.timers.tick(1800);

  timers.clear();
  assert.equal(timers.size, 0);
  timers.schedule(() => events.push("new patch"), 4200);
  t.mock.timers.tick(4200);

  assert.deepEqual(events, ["airlock", "new patch"]);
  assert.equal(timers.size, 0);
});

test("cleanup cancels all work even before the first breach step", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const timers = createDemoTimers();
  let completed = false;
  timers.schedule(() => { completed = true; }, 1800);
  timers.clear();
  timers.clear();
  t.mock.timers.tick(5000);
  assert.equal(completed, false);
  assert.equal(timers.size, 0);
});
