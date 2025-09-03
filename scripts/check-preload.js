const fs = require('fs');
const path = require('path');
const preloadPath = path.join(__dirname, '..', 'build', 'preload.js');
if (!fs.existsSync(preloadPath)) {
  console.error('Missing preload bundle at', preloadPath);
  process.exit(1);
}
