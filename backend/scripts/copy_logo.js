const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\addmy\\.gemini\\antigravity-ide\\brain\\68a5f196-0ea5-4068-b5ee-90cb47960675\\.user_uploaded\\media_1788821035425.png';
const destDir = path.join(__dirname, '../../frontend/public');

const targets = [
  'maedbet_logo.png',
  'bulebet_logo.png',
  'bulebet_title_logo.png',
  'bulebet_footer_logo.png',
  'bulebet_emblem.png',
  'bulebet_light_emblem.png',
  'bulebet_text_logo.png',
  'bulebet_light_logo.png'
];

if (fs.existsSync(src)) {
  const data = fs.readFileSync(src);
  targets.forEach(t => {
    fs.writeFileSync(path.join(destDir, t), data);
    console.log(`Copied new transparent logo to ${t}`);
  });
} else {
  console.error(`Source file ${src} not found`);
}
