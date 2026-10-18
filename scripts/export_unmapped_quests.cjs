const fs = require('fs');
const path = require('path');

const questsPath = path.join(__dirname, '../src/data/quests.json');
const mapsPath = path.join(__dirname, '../src/data/maps.json');

const quests = JSON.parse(fs.readFileSync(questsPath, 'utf8'));
const maps = JSON.parse(fs.readFileSync(mapsPath, 'utf8'));

// Agrupar por mapa los objetivos que no tienen poiId asignado
const mapGroups = {};

maps.forEach((m) => {
  mapGroups[m.id] = {
    mapId: m.id,
    mapName: m.name.en,
    existingPois: m.pois.map((p) => ({
      id: p.id,
      name: p.name.en,
      coordinates: p.coordinates,
    })),
    unmappedObjectives: [],
  };
});

quests.forEach((q) => {
  q.objectives.forEach((obj) => {
    if (obj.mapId && obj.mapId !== 'any' && !obj.poiId) {
      if (!mapGroups[obj.mapId]) {
        mapGroups[obj.mapId] = {
          mapId: obj.mapId,
          mapName: obj.mapId,
          existingPois: [],
          unmappedObjectives: [],
        };
      }
      mapGroups[obj.mapId].unmappedObjectives.push({
        questId: q.id,
        questTitle: q.title.en,
        objectiveId: obj.id,
        objectiveDescription: obj.description.en,
      });
    }
  });
});

const outputPath = path.join(__dirname, '../unmapped_quests_for_llm.json');
fs.writeFileSync(outputPath, JSON.stringify(mapGroups, null, 2), 'utf8');

console.log('✅ Archivo generado exitosamente:', outputPath);
console.log('Mapas encontrados con objetivos pendientes:');
Object.values(mapGroups).forEach((g) => {
  if (g.unmappedObjectives.length > 0) {
    console.log(`- ${g.mapName} (${g.mapId}): ${g.unmappedObjectives.length} objetivos sin POI`);
  }
});
