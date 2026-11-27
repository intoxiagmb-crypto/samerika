import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PHASES, ROLES, LEAD_STATUSES } from '../lib/policy.mjs';

// Render the real TSX components in Node without a browser or an added test framework.
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const modules = new Map();
function component(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const loaded = { exports: {} };
  modules.set(filename, loaded.exports);
  const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const localRequire = specifier => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return require(specifier);
    const path = specifier.startsWith('@/') ? resolve(root, specifier.slice(2)) : resolve(dirname(filename), specifier);
    return existsSync(path) ? require(path) : component(`${path}.tsx`);
  };
  runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const Tracker = component(resolve(root, 'components/application-tracker.tsx')).default;
const Timeline = component(resolve(root, 'components/project-timeline.tsx')).default;
const project = {
  id: 'SOL-TEST', version: 1, status: 'Survey',
  data: { name: 'Test customer', capacity: 3, system: 'On-grid', city: 'Jaipur', finance: 'Finance',
    tracking: { applicationNumber: 'APP-123' }, requiredApprovals: ['Bank approval'],
    phases: PHASES.map(name => ({ name, status: 'Pending' })) },
};
const shared = { records: [], requiredDocuments: ['Electricity bill'] };

test('application tracking displays project status without mutation controls for every role', () => {
  for (const role of ROLES) {
    const html = renderToStaticMarkup(React.createElement(Tracker, {
      ...shared, projects: [project], role, selectedId: project.id, saving: false,
      onSelect() {}, onDetails() {}, onRefresh: async () => {},
    }));
    assert.match(html, /APP-123/);
    assert.match(html, /Site Survey/);
    assert.match(html, /Pending/);
    assert.equal((html.match(/<select/g) || []).length, 1, `${role}: only the project selector is allowed`);
    assert.doesNotMatch(html, /<input|<textarea|Edit application number|Complete project|Upload document|Notes \/ reference/);
  }
});

test('project timeline retains authorized editing while tracking is read-only', () => {
  const html = renderToStaticMarkup(React.createElement(Timeline, {
    ...shared, project, role: 'ADMIN', saving: false, error: '', onUpdate: async () => {}, onUpload: async () => {},
  }));
  assert.match(html, /<select aria-label="Site Survey status"/);
  assert.match(html, /Upload documentation/);
  assert.match(html, /Complete project/);
});


test('coloured lead status picker preserves the named form value and accessible label', () => {
  const StatusSelect = component(resolve(root, 'components/lead-status-select.tsx')).default;
  for (const status of LEAD_STATUSES) {
    const html = renderToStaticMarkup(React.createElement('form', null, React.createElement(StatusSelect, {
      label: 'Lead status', name: 'status', defaultValue: status, required: true,
      options: LEAD_STATUSES.map(value => ({ value, label: value })),
    })));
    assert.match(html, /role="combobox"/);
    assert.match(html, /aria-label="Lead status"/);
    assert.match(html, /<input type="hidden" name="status"/);
    assert.ok(html.includes(`name="status" value="${status}"`), `${status} must be submitted with the form`);
  }
});
