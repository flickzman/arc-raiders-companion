const fs = require('fs');
const path = require('path');

const questsPath = path.join(__dirname, '../src/data/quests.json');
const mapsPath = path.join(__dirname, '../src/data/maps.json');
const inputPath = process.argv[2] || path.join(__dirname, '../mapped_quests_input.json');

if (!fs.existsSync(inputPath)) {
  console.error(`❌ Archivo no encontrado: ${inputPath}`);
  console.log('Uso: node scripts/import_mapped_quests.cjs [ruta_al_archivo_json]');
  process.exit(1);
}

const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const quests = JSON.parse(fs.readFileSync(questsPath, 'utf8'));
const maps = JSON.parse(fs.readFileSync(mapsPath, 'utf8'));

let updatedObjectives = 0;
let newPoisCount = 0;

// Estructura esperada de inputData:
// Array de:
// {
//   objectiveId: string,
//   poiId: string,
//   poiDetails?: {
//     id: string,
//     mapId: string,
//     name: { en: string, es?: string },
//     coordinates: { x: number, y: number },
//     dangerLevel?: "low" | "medium" | "high"
//   }
// }
// O Map { objectiveId: poiId }

const updatesMap = new Map();
const poiCatalog = new Map();

if (Array.isArray(inputData)) {
  inputData.forEach((item) => {
    if (item.objectiveId && item.poiId) {
      updatesMap.set(item.objectiveId, item.poiId);
      if (item.poiDetails) {
        poiCatalog.set(item.poiDetails.id, item.poiDetails);
      }
    }
  });
} else if (typeof inputData === 'object') {
  Object.entries(inputData).forEach(([objId, val]) => {
    if (typeof val === 'string') {
      updatesMap.set(objId, val);
    } else if (val && val.poiId) {
      updatesMap.set(objId, val.poiId);
      if (val.poiDetails) {
        poiCatalog.set(val.poiDetails.id, val.poiDetails);
      }
    }
  });
}

// 1. Añadir POIs nuevos a los mapas si no existen
poiCatalog.forEach((newPoi) => {
  const targetMap = maps.find((m) => m.id === newPoi.mapId);
  if (targetMap) {
    const exists = targetMap.pois.some((p) => p.id === newPoi.id);
    if (!exists) {
      targetMap.pois.push({
        id: newPoi.id,
        name: newPoi.name || { en: newPoi.id, es: newPoi.id },
        mapId: newPoi.mapId,
        coordinates: newPoi.coordinates || { x: 50, y: 50 },
        dangerLevel: newPoi.dangerLevel || 'medium',
        isExtractionPoint: false,
        isSpawnPoint: false,
      });
      newPoisCount++;
    }
  }
});

// 2. Actualizar los objetivos en quests.json
quests.forEach((q) => {
  q.objectives.forEach((obj) => {
    if (updatesMap.has(obj.id)) {
      obj.poiId = updatesMap.get(obj.id);
      updatedObjectives++;
    }
  });
});

fs.writeFileSync(questsPath, JSON.stringify(quests, null, 2), 'utf8');
fs.writeFileSync(mapsPath, JSON.stringify(maps, null, 2), 'utf8');

console.log(`✅ Fusión completada con éxito:`);
console.log(`- ${updatedObjectives} objetivos vinculados a su POI`);
console.log(`- ${newPoisCount} nuevos POIs añadidos al catálogo de mapas`);
