import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const script = readFileSync(new URL('./app/src/main/assets/integration.js', import.meta.url), 'utf8');
function setup(size = 100) {
  const calls = { prompts: [], fetches: [], alerts: [], originalClicks: 0 };
  class Anchor {
    constructor(href = 'blob:https://www.samerikapower.com/report') { this.href = href; this.download = 'report.csv'; }
    hasAttribute(name) { return name === 'download'; }
    click() { calls.originalClicks++; }
  }
  const window = {
    prompt: (...args) => calls.prompts.push(args),
    alert: value => calls.alerts.push(value),
  };
  const context = vm.createContext({
    window, HTMLAnchorElement: Anchor,
    document: { addEventListener: (_, handler) => { calls.handler = handler; } },
    fetch: url => { calls.fetches.push(url); return Promise.resolve({ blob: () => Promise.resolve({ size, type: 'text/csv' }) }); },
    FileReader: class { readAsDataURL() { this.result = 'data:text/csv;base64,YQ=='; this.onload(); } },
  });
  vm.runInContext(script, context);
  return { calls, Anchor, window, context };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('detached CSV export starts reading before object URL revocation', async () => {
  const { calls, Anchor } = setup();
  new Anchor().click();
  assert.equal(calls.fetches.length, 1);
  assert.equal(calls.originalClicks, 0);
  await flush();
  assert.equal(calls.prompts[0][0], 'samerika:save');
  assert.deepEqual(JSON.parse(calls.prompts[0][1]), { name: 'report.csv', mime: 'text/csv', data: 'YQ==' });
});
test('normal links remain intact and installing hooks twice is harmless', () => {
  const { calls, Anchor, window, context } = setup();
  vm.runInContext(script, context);
  new Anchor('https://www.samerikapower.com/').click();
  assert.equal(calls.originalClicks, 1);
  window.print();
  assert.equal(calls.prompts[0][0], 'samerika:print');
});
test('oversized exports report failure without opening save dialog', async () => {
  const { calls, Anchor } = setup(9 * 1024 * 1024);
  new Anchor().click();
  await flush();
  assert.equal(calls.prompts.length, 0);
  assert.match(calls.alerts[0], /8 MB/);
});
test('user-clicked blob downloads use the same export handler', async () => {
  const { calls, Anchor } = setup();
  let prevented = false;
  calls.handler({ target: { closest: () => new Anchor() }, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  await flush();
  assert.equal(calls.prompts.length, 1);
});
