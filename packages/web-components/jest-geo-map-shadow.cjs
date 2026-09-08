const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

/** Jest stub for rd-geo-map.shadow.ts — read co-located html/css from disk. */
const shadowDir = join(__dirname, 'src/visual/display/geo-map');

module.exports = {
  geoMapShadowHtml: readFileSync(join(shadowDir, 'rd-geo-map.html'), 'utf8'),
  geoMapShadowCss: readFileSync(join(shadowDir, 'rd-geo-map.css'), 'utf8'),
};
