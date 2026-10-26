// Copies only the files the game needs into dist/ (leaves out rpc-bridge, README, etc.)
const fs = require('fs');
const path = require('path');

const out = 'dist';
const files = ['index.html', 'style.css', 'game.js', 'rpc.js', 'songs.json', 'assets'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of files) fs.cpSync(f, path.join(out, f), { recursive: true });
fs.writeFileSync(path.join(out, '.nojekyll'), '');   // tells GitHub Pages not to run Jekyll
console.log('Built ' + out + '/');
