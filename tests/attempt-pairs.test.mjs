import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const root = new URL('../dist/', import.meta.url);
const page = await readFile(new URL('read/once-or-every/index.html', root), 'utf8');
const data = JSON.parse(await readFile(new URL('assets/kit/attempt-pairs.json', root), 'utf8'));
test('the native pair table and downloadable data cover each unordered pair exactly once', () => {
 const labels = ['A','B','C','D','E'];
 const expected = [];
 for (let i=0;i<labels.length;i++) for (let j=i+1;j<labels.length;j++) expected.push(labels[i]+labels[j]);
 assert.deepEqual(data.pairs.map(p => p.id), expected);
 const rows = [...page.matchAll(/<tr data-pair="([A-E]{2})"><th scope="row">([A-E]) \+ ([A-E])<\/th><td>(Yes|No)<\/td><td>(Yes|No)<\/td><\/tr>/g)];
 assert.deepEqual(rows.map(r=>r[1]),expected);
 let any=0, every=0;
 for(const r of rows){
  const pass=[r[2],r[3]].map(id=>'ABC'.includes(id));
  assert.equal(r[4],pass.some(Boolean)?'Yes':'No');
  assert.equal(r[5],pass.every(Boolean)?'Yes':'No');
  const datum=data.pairs.find(p=>p.id===r[1]);
  assert.equal(datum.atLeastOne,r[4]==='Yes');assert.equal(datum.every,r[5]==='Yes');
  any+=r[4]==='Yes';every+=r[5]==='Yes';
 }
 assert.equal(any,9);assert.equal(every,3);
 assert.match(page,/9 of 10<br><strong>90%/);assert.match(page,/3 of 10<br><strong>30%/);
});
test('the reading aid keeps the evaluator, finite-pool and historical scope beside the example',async()=>{
 for(const text of ['not known probabilities for future runs','No model was run','simulated users','miss a policy violation','Whole-task reruns','n ≥ k ≥ 1','2021','June 2024']) assert.ok(page.includes(text),text);
 for(const url of data.sources)assert.ok(page.includes(`href="${url}"`));
 assert.doesNotMatch(page,/<script\b|on(?:load|click)=/i);
 assert.match(page,/<caption>Every distinct pair/);
 assert.equal((page.match(/<h1\b/g)||[]).length,1);
 assert.ok((await readFile(new URL('index.html',root),'utf8')).includes('href="/read/once-or-every"'));
 assert.ok((await readFile(new URL('sitemap.xml',root),'utf8')).includes('/read/once-or-every</loc>'));
 for(const path of ['assets/css/attempt-pairs.css','assets/kit/once-or-every.png','assets/kit/once-or-every.svg'])assert.ok((await stat(new URL(path,root))).size>0);
});
