'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
function read(name){return fs.readFileSync(path.join(root,name),'utf8')}
const integrity=read('.github/workflows/integrity.yml');
const browser=read('.github/workflows/browser-tests.yml');
const lighthouse=read('.github/workflows/lighthouse.yml');
const roster=read('.github/workflows/official-roster-watch.yml');
assert.match(integrity,/push:\s*\n\s*branches: \[main\]/,'Integrity not triggered on production updates');
assert.match(integrity,/pull_request:\s*\n\s*branches: \[main\]/,'Integrity missing PR checks');
assert.match(browser,/pull_request:\s*\n\s*branches: \[main\]/,'Browser regression missing PR checks');
assert.doesNotMatch(browser,/^\s{2}push:/m,'Browser regression should not duplicate production pushes');
assert.match(browser,/workflow_dispatch:/,'Cannot manually rerun browser checks');
assert.match(browser,/cancel-in-progress: true/,'Duplicate browser jobs not cancelled');
assert.match(lighthouse,/workflow_dispatch:/,'Lighthouse manual audit unavailable');
assert.doesNotMatch(lighthouse,/^\s{2}(?:push|pull_request):/m,'Lighthouse should not run for every commit');
assert.match(roster,/schedule:/,'Official roster must be checked on schedule');
assert.doesNotMatch(roster,/^\s{2}pull_request:/m,'Roster schedule should not spam PRs');
for(const file of ['data-integrity.test.cjs','cavaliers-core.test.cjs','offline-policy.test.cjs','vector-pdf.test.cjs','official-roster.test.cjs','privacy-release.test.cjs','night-contrast.test.cjs','workflow-policy.test.cjs']){
 assert.ok(fs.existsSync(path.join(root,'tests',file)),file+' absent');
 assert.ok(integrity.includes('node tests/'+file),file+' not executed by CI');
}
assert.match(integrity,/js\/\*\.js scripts\/\*\.cjs tests\/\*\.cjs/,'Syntax checks omit subfolders');
console.log('PASS: CI triggers, concurrency, scope and test registration');
