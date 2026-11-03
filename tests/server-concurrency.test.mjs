import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

// Exercise only session creation; no tutor/provider is called.
test('overlapping request bodies cannot enter persistence together', {timeout: 15000}, async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'habla-concurrency-'));
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: {...process.env, NODE_ENV: 'production', PORT: String(port), HABLA_DATA_DIR: dir},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stderr.on('data', chunk => { output += chunk; });
  t.after(async () => {
    if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
    await rm(dir, {recursive: true, force: true});
  });
  await new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => { if (String(chunk).includes('Habla is ready:')) resolve(); });
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Server exited ${code}: ${output}`)));
  });
  const base = `http://127.0.0.1:${port}`;
  const state = await fetch(`${base}/api/state`).then(r => r.json());
  const body = JSON.stringify({deckId: state.unit.decks[0].id, tense: 'present', mode: 'vocabulary'});
  function heldRequest() {
    let finish;
    const result = new Promise((resolve, reject) => {
      const req = request(`${base}/api/sessions`, {method: 'POST', headers: {
        'content-type': 'application/json', 'x-habla-token': state.token,
        'content-length': Buffer.byteLength(body),
      }}, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
      req.on('error', reject);
      req.flushHeaders();
      finish = () => req.end(body);
    });
    return {finish, result};
  }
  const first = heldRequest();
  const second = heldRequest();
  // Let the server begin waiting for both bodies, then deliver them together.
  await new Promise(resolve => setTimeout(resolve, 50));
  first.finish(); second.finish();
  assert.deepEqual((await Promise.all([first.result, second.result])).sort(), [201, 409]);
  const saved = JSON.parse(await readFile(path.join(dir, 'progress.json'), 'utf8'));
  assert.equal(saved.sessions.length, 1);
});
