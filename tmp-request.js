const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/suporte',
  method: 'GET'
};
const req = http.request(options, res => {
  console.log('statusCode', res.statusCode);
  res.setEncoding('utf8');
  res.on('data', chunk => process.stdout.write(chunk));
});
req.on('error', error => console.error('ERROR:', error));
req.end();
