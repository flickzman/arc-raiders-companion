const quests = require('../src/data/quests.json');

const testTitles = [
  'DISTRACT AND DESTROY ARC ENEMIES',
  'SIZING THINGS UP',
  'REDUCED TO RUBBLE',
  'TO THE SKIES',
  "CELESTE'S CHILDHOOD DRAWINGS",
  'BOARDING THE FRIGATE',
  'MEDICAL MERCHANDISE',
  'CLAMORING FOR ATTENTION'
];

console.log('Total misiones en quests.json:', quests.length);

for (const t of testTitles) {
  const cleanT = t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const found = quests.find(q => {
    const en = q.title.en.toLowerCase().replace(/[^a-z0-9]/g, '');
    const es = (q.title.es || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return en === cleanT || es === cleanT || en.includes(cleanT) || cleanT.includes(en);
  });
  console.log(t, '===>', found ? `${found.id} | "${found.title.en}"` : '❌ NO ENCONTRADA EN DB');
}
