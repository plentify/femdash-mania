// Local bridge: the game posts its status here, and this forwards it to the
// Discord desktop app over IPC (browsers can't talk to Discord directly).
const http = require('http');
const fs = require('fs');
const path = require('path');
const RPC = require('discord-rpc');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'rpc-config.json'), 'utf8'));
if (!cfg.clientId || cfg.clientId.startsWith('YOUR_')) {
  console.error('Put your Discord Application ID in rpc-bridge/rpc-config.json first.');
  process.exit(1);
}

let client = null, ready = false, pending = null, lastSent = 0, timer = null;

function clip(s) {
  s = String(s || '').trim();
  if (s.length < 2) s = s + '  ';
  return s.slice(0, 120);
}

function connect() {
  client = new RPC.Client({ transport: 'ipc' });
  client.on('ready', () => {
    ready = true;
    console.log('Connected to Discord as ' + (client.user ? client.user.username : 'unknown'));
    flush();
  });
  client.on('disconnected', () => { ready = false; setTimeout(connect, 10000); });
  client.login({ clientId: cfg.clientId }).catch(err => {
    ready = false;
    console.log('Discord not reachable (' + err.message + '). Is the desktop app open? Retrying in 10s.');
    setTimeout(connect, 10000);
  });
}

function flush() {
  if (!ready || !pending || timer) return;
  const wait = Math.max(0, 4000 - (Date.now() - lastSent));   // stay under Discord's rate limit
  timer = setTimeout(() => {
    timer = null;
    const a = pending; pending = null;
    if (!a) return;
    const act = { details: clip(a.details), state: clip(a.state), instance: false };
    if (cfg.largeImageKey) { act.largeImageKey = cfg.largeImageKey; act.largeImageText = 'FemDash!Mania'; }
    if (a.start) act.startTimestamp = new Date(a.start);
    client.setActivity(act).catch(e => console.log('setActivity failed:', e.message));
    lastSent = Date.now();
    flush();
  }, wait);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method === 'POST' && req.url === '/presence') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on('end', () => {
      try { pending = JSON.parse(body); flush(); res.writeHead(204); }
      catch (e) { res.writeHead(400); }
      res.end();
    });
    return;
  }
  res.writeHead(200); res.end('FemDash!Mania RPC bridge is running');
}).listen(cfg.port || 3737, '127.0.0.1', () => console.log('Bridge listening on http://127.0.0.1:' + (cfg.port || 3737)));

connect();
