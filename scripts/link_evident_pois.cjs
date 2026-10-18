const fs = require('fs');
const path = require('path');

const questsPath = path.join(__dirname, '../src/data/quests.json');
const mapsPath = path.join(__dirname, '../src/data/maps.json');

const quests = JSON.parse(fs.readFileSync(questsPath, 'utf8'));
const maps = JSON.parse(fs.readFileSync(mapsPath, 'utf8'));

const mapPoiIndex = {};
maps.forEach((m) => {
  mapPoiIndex[m.id] = m.pois;
});

let linked = 0;

quests.forEach((q) => {
  q.objectives.forEach((obj) => {
    if (obj.mapId && obj.mapId !== 'any' && !obj.poiId) {
      const pois = mapPoiIndex[obj.mapId] || [];
      const descLower = (obj.description.en + ' ' + (obj.description.es || '')).toLowerCase();

      let bestPoi = null;
      for (const p of pois) {
        const pNameEn = p.name.en.toLowerCase();
        const pNameEs = (p.name.es || '').toLowerCase();

        const keywords = [...pNameEn.split(/\s+/), ...pNameEs.split(/\s+/)].filter(
          (w) => w.length >= 5 && !['complex', 'station', 'extract', 'ingress', 'outpost'].includes(w)
        );

        for (const kw of keywords) {
          if (descLower.includes(kw)) {
            bestPoi = p;
            break;
          }
        }
        if (bestPoi) break;
      }

      if (bestPoi) {
        obj.poiId = bestPoi.id;
        linked++;
      }
    }
  });
});

fs.writeFileSync(questsPath, JSON.stringify(quests, null, 2), 'utf8');
console.log(`✅ ${linked} objetivos vinculados exitosamente a sus POIs oficiales existentes.`);
