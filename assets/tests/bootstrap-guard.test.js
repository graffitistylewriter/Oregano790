import assert from "node:assert/strict";
import test from "node:test";

const { createBootstrapGuard } = await import("../js/runtime/bootstrap-guard.js");

test("bootstrap guard reuses the same in-flight promise", async () => {
    let calls = 0;
    const guard = createBootstrapGuard(async () => {
        calls += 1;
        return "booted";
    });
    const scope = {};

    const first = guard(scope);
    const second = guard(scope);

    assert.strictEqual(first, second);
    assert.equal(await first, "booted");
    assert.equal(calls, 1);
});

test("bootstrap guard preserves the runtime scope promise after completion", async () => {
    const guard = createBootstrapGuard(() => "ready");
    const scope = {};

    const promise = guard(scope);

    assert.strictEqual(scope.__oreganoBootstrapPromise, promise);
    assert.equal(await promise, "ready");
    assert.strictEqual(guard(scope), promise);
});

test("bootstrap guard rejects an invalid boot function", () => {
    assert.throws(() => createBootstrapGuard(null), TypeError);
});
