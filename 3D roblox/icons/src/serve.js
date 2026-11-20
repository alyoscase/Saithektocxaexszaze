// Serves only *.png from the given folder on localhost (for Studio upload_image).
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2], port = +process.argv[3] || 8765;
http.createServer((req, res) => {
  const name = path.basename(decodeURIComponent(req.url.split('?')[0]));
  const file = path.join(root, name);
  if (!name.endsWith('.png') || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'image/png' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log('serving', root, 'on', port));
