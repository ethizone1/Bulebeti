const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it has the string
    if (content.includes('http://localhost:5000')) {
      // Calculate relative path for config
      let relativeToSrc = path.relative(path.dirname(filePath), srcDir);
      let configImportPath = relativeToSrc === '' ? './config' : relativeToSrc.replace(/\\/g, '/') + '/config';
      
      let importStatement = `import config from '${configImportPath}';\n`;
      
      if (!content.includes(`import config from`)) {
        // Insert after last import, or at top
        let lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          let endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
          content = importStatement + content;
        }
      }

      // Replace 'http://localhost:5000/...' with `${config.API_URL}/...`
      // For string literals: 'http://localhost:5000/api' -> `${config.API_URL}/api`
      // We must change the surrounding quotes to backticks if they aren't already.
      
      content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, '`${config.API_URL}$1`');
      content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, '`${config.API_URL}$1`');
      content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, '`${config.API_URL}$1`');
      // Some might just be substrings inside a larger template literal:
      content = content.replace(/http:\/\/localhost:5000/g, '${config.API_URL}');
      
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      console.log('Updated:', filePath);
    }
  }
});

console.log(`Finished updating ${modifiedFiles} files.`);
