const { readFileSync } = require('node:fs');

/** Jest: resolve Vite `?raw` imports to file contents. */
module.exports = {
  process(_src, filename) {
    const rawPath = filename.replace(/\?raw(\?.*)?$/, '');
    const content = readFileSync(rawPath, 'utf8');
    return { code: `module.exports = ${JSON.stringify(content)};` };
  },
};
