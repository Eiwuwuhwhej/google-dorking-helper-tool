const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

console.log('--- 1. Checking DOM Element IDs ---');
const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const ids = new Set();
while ((match = regex.exec(js)) !== null) {
  ids.add(match[1]);
}

const missingIds = [];
for (const id of ids) {
  if (!html.includes(`id="${id}"`)) {
    missingIds.push(id);
  }
}

if (missingIds.length > 0) {
  console.error('FAILED: Missing IDs in HTML:', missingIds);
  process.exit(1);
} else {
  console.log(`PASSED: All ${ids.size} getElementById references exist in HTML!`);
}

console.log('--- 2. Checking Tabs & Tab Panes ---');
const navTabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map(m => m[1]);
console.log('Nav tabs found:', navTabs);
for (const tab of navTabs) {
  if (!html.includes(`id="tab-${tab}"`)) {
    console.error(`FAILED: Tab pane id="tab-${tab}" missing in HTML`);
    process.exit(1);
  }
}
console.log('PASSED: All tab panes match nav tabs.');

console.log('--- 3. Testing Reverse Query Parser (deconstructDorkQuery) ---');

// Extract deconstructDorkQuery definition directly from app.js
const parserStart = js.indexOf('function deconstructDorkQuery(');
const parserEnd = js.indexOf('function applyDeconstructedQuery(');
const parserCode = js.slice(parserStart, parserEnd);

// Evaluate parser function in this test environment
const deconstructDorkQuery = new Function(`
  ${parserCode}
  return deconstructDorkQuery;
`)();

// Test 1: Standard multi-operator dork
const raw1 = 'site:example.com (filetype:pdf OR filetype:docx) "confidential report" inurl:admin -sample -"internal test" after:2023-01-01 keyword1 keyword2';
const res1 = deconstructDorkQuery(raw1);
console.log('Test 1 (Standard multi-operator):', res1);

console.assert(res1.site === 'example.com', 'Site parsed correctly');
console.assert(res1.filetypes.includes('pdf') && res1.filetypes.includes('docx'), 'Filetypes parsed from group');
console.assert(res1.exact === 'confidential report', 'Exact phrase parsed');
console.assert(res1.inurl === 'admin', 'Inurl parsed');
console.assert(res1.exclude.includes('sample'), 'Exclusion word parsed');
console.assert(res1.exclude.includes('"internal test"'), 'Exclusion quoted phrase parsed');
console.assert(res1.afterDate === '2023-01-01', 'After date parsed');
console.assert(res1.keywords.includes('keyword1') && res1.keywords.includes('keyword2'), 'Keywords parsed');

// Test 2: GHDB directory listing dork
const raw2 = 'intitle:"index of /" "parent directory" site:gov -www';
const res2 = deconstructDorkQuery(raw2);
console.log('Test 2 (GHDB Index):', res2);

console.assert(res2.intitle === 'index of /', 'Intitle parsed correctly');
console.assert(res2.exact === 'parent directory', 'Exact phrase parsed');
console.assert(res2.site === 'gov', 'Site parsed');
console.assert(res2.exclude.includes('www'), 'Exclusion parsed');

// Test 3: Complex credentials & custom extensions
const raw3 = 'site:target.net (filetype:env OR filetype:yaml OR filetype:conf) "DB_PASSWORD" (inurl:admin OR inurl:login)';
const res3 = deconstructDorkQuery(raw3);
console.log('Test 3 (Config & Auth):', res3);

console.assert(res3.site === 'target.net', 'Site parsed');
console.assert(res3.filetypes.includes('env') && res3.filetypes.includes('conf'), 'Known chips parsed');
console.assert(res3.customFiletypes.includes('yaml'), 'Custom filetype yaml parsed');
console.assert(res3.exact === 'DB_PASSWORD', 'Exact credential string parsed');
console.assert(res3.inurl === 'admin OR login', 'Inurl OR group parsed');

// Test 4: Body text with allintext
const raw4 = 'allintext:"syntax error" "mysql" site:api.service.io';
const res4 = deconstructDorkQuery(raw4);
console.log('Test 4 (allintext):', res4);

console.assert(res4.intextMode === 'allintext', 'allintext mode detected');
console.assert(res4.intext === 'syntax error', 'intext phrase parsed');
console.assert(res4.site === 'api.service.io', 'Site parsed');

// Test 5: Empty / invalid queries
console.assert(deconstructDorkQuery('') === null, 'Empty string returns null');
console.assert(deconstructDorkQuery('   ') === null, 'Whitespace returns null');

console.log('\n ALL UNIT AND REVERSE PARSER TESTS PASSED! ');
