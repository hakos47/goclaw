const fs = require('fs');

function unflatten(data) {
  if (Object(data) !== data || Array.isArray(data)) return data;
  var result = {}, cur, prop, parts, idx;
  for(var p in data) {
    cur = result, prop = "";
    parts = p.split(".");
    for(var i=0; i<parts.length; i++) {
      idx = !isNaN(parseInt(parts[i]));
      cur = cur[prop] || (cur[prop] = (idx ? [] : {}));
      prop = parts[i];
    }
    cur[prop] = data[p];
  }
  return result[""];
}

const files = [
  '/mnt/Athenea/hakos/claude-nix/go-claw/ui/svelte-v2/src/lib/i18n/locales/en/config.json',
  '/mnt/Athenea/hakos/claude-nix/go-claw/ui/svelte-v2/src/lib/i18n/locales/es/config.json'
];

files.forEach(file => {
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  // Custom unflatten logic because the above one adds a root "" key
  const result = {};
  for (const key in obj) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = obj[key];
  }

  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`Unflattened ${file}`);
});
