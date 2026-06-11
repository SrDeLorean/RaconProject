const fs = require('fs');
const path = require('path');

const dir = 'c:/xampp/htdocs/RaconProject/frontend/src/features/public/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // 1. Remove || 'http://localhost:8000'
  content = content.replace(/\|\|\s*'http:\/\/localhost:8000'/g, '');
  
  // 2. Replace hardcoded template strings `http://localhost:8000${...}` with `window.mediaUrl(...)`
  content = content.replace(/`http:\/\/localhost:8000\$\{([^}]+)\}`/g, 'window.mediaUrl($1)');
  
  // 3. Fallback for any other literal 'http://localhost:8000'
  content = content.replace(/'http:\/\/localhost:8000'/g, "''");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles++;
    console.log('Cleaned:', file);
  }
});

console.log('Total files cleaned:', changedFiles);
