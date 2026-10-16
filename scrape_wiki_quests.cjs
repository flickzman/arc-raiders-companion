const fs = require('fs');
const path = require('path');

const MAP_NAME_TO_ID = {
  'dam battlegrounds': 'dam_battlegrounds',
  'dam': 'dam_battlegrounds',
  'buried city': 'buried_city',
  'spaceport': 'the_spaceport',
  'the spaceport': 'the_spaceport',
  'blue gate': 'the_blue_gate',
  'the blue gate': 'the_blue_gate',
  'stella montis': 'stella_montis',
  'pendola pass': 'pendola_pass',
  'riven tides': 'riven_tides',
  'practice range': 'practice_range',
  'any': 'any',
};

const VENDORS = ['Apollo', 'Shani', 'Celeste', 'Tian Wen', 'Lance', 'Nomadic Envoys'];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cleanWikitext(str) {
  if (!str) return '';
  return str
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferQuestType(text) {
  const lower = text.toLowerCase();
  if (/kill|destroy|defeat|eliminate|hunt|combat|shoot|take down|destroying/i.test(lower)) return 'combat';
  if (/extract|exfiltrate|escape|evacuate/i.test(lower)) return 'extraction';
  if (/sabotage|disrupt|overload|cut|shut down|blow up/i.test(lower)) return 'sabotage';
  if (/deliver|hand over|bring back|give to/i.test(lower)) return 'delivery';
  if (/unlock|keycard|locked|breach door|security code/i.test(lower)) return 'locked_room';
  return 'recon';
}

function determineObjectiveMap(label, defaultMap) {
  const lower = label.toLowerCase();
  if (lower.includes('riven tides') || lower.includes('seawall') || lower.includes('hotel beach')) return 'riven_tides';
  if (lower.includes('dam battlegrounds') || lower.includes('alcantara') || lower.includes('power station')) return 'dam_battlegrounds';
  if (lower.includes('buried city') || lower.includes('grandioso')) return 'buried_city';
  if (lower.includes('spaceport') || lower.includes('launchpad')) return 'the_spaceport';
  if (lower.includes('blue gate')) return 'the_blue_gate';
  if (lower.includes('stella montis')) return 'stella_montis';
  if (lower.includes('pendola pass') || lower.includes('pendola')) return 'pendola_pass';
  if (lower.includes('practice range')) return 'practice_range';
  return defaultMap;
}

const TACTICAL_QUEST_OVERRIDES = {
  'quest_rising_tide': {
    titleEs: 'Marea Creciente',
    objectives: [
      {
        id: 'obj_rt_1',
        description: {
          en: 'Unlock the top-floor foreman suite at Grandioso Apartments and retrieve the logbook',
          es: 'Abre la suite del capataz en Apartamentos Grandioso y recupera el diario digital',
        },
        type: 'locked_room',
        mapId: 'buried_city',
        poiId: 'city_grandioso_apartments',
        alternativePoiIds: [],
        inOneRound: false,
        requiredItemId: 'item_key_grandioso',
        targetItemId: 'item_foreman_log',
        count: 1,
      },
      {
        id: 'obj_rt_2',
        description: {
          en: 'Restore power with a Power Cell and scan telemetry at Controlled Access Zone',
          es: 'Restaura la energía con una Célula y escanea la telemetría en la Zona de Acceso Controlado',
        },
        type: 'recon',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_controlled_access',
        alternativePoiIds: [],
        inOneRound: false,
        dependsOnObjectiveId: 'obj_rt_1',
        requiredItemId: 'item_power_cell',
        count: 1,
      },
    ],
    itemsToBring: [
      { itemId: 'item_key_grandioso', count: 1, optional: false },
      { itemId: 'item_power_cell', count: 1, optional: false },
    ],
  },
  'quest_off_the_radar': {
    titleEs: 'Fuera del Radar',
    objectives: [
      {
        id: 'obj_otr_1',
        description: {
          en: 'In a single round, visit a Field Depot and repair the rooftop radio antenna (South Swamp or North Ridge)',
          es: 'En una sola ronda, visita un Puesto de Campo y repara la antena de radio (Pantano Sur o Cresta Norte)',
        },
        type: 'recon',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_south_swamp',
        alternativePoiIds: ['dam_north_ridge'],
        inOneRound: true,
        count: 1,
      },
    ],
    itemsToBring: [],
  },
  'quest_hatch_repairs': {
    titleEs: 'Reparación de Escotillas',
    objectives: [
      {
        id: 'obj_hatch_1',
        description: {
          en: 'Paso 1: Search the raider cache at South Swamp Outpost for a Raider Hatch Keycard',
          es: 'Paso 1: Busca en el alijo de Pantano Sur para obtener una Tarjeta de Escotilla Raider',
        },
        type: 'recon',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_south_swamp',
        alternativePoiIds: [],
        inOneRound: false,
        targetItemId: 'item_hatch_key',
        count: 1,
      },
      {
        id: 'obj_hatch_2',
        description: {
          en: 'Paso 2: Unlock the drainage pipeline hatch in Controlled Access Zone and seal the leak',
          es: 'Paso 2: Desbloquea la escotilla en la Zona de Acceso Controlado y sella la fuga',
        },
        type: 'locked_room',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_controlled_access',
        alternativePoiIds: [],
        inOneRound: false,
        dependsOnObjectiveId: 'obj_hatch_1',
        requiredItemId: 'item_hatch_key',
        count: 1,
      },
    ],
    itemsToBring: [],
  },
  'quest_what_we_left': {
    titleEs: 'Lo Que Dejamos Atrás',
    objectives: [
      {
        id: 'obj_wwl_1',
        description: {
          en: 'Investigate the ruined antenna tower at South Swamp Outpost',
          es: 'Investiga la torre de antena en ruinas en el Puesto del Pantano Sur',
        },
        type: 'recon',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_south_swamp',
        alternativePoiIds: [],
        inOneRound: false,
        count: 1,
      },
      {
        id: 'obj_wwl_2',
        description: {
          en: 'Search the raider cache in Underground Parking Garage for ARC Logic Microchips',
          es: 'Busca en el alijo raider del Aparcamiento Subterráneo para conseguir Microchips Lógicos ARC',
        },
        type: 'recon',
        mapId: 'buried_city',
        poiId: 'city_parking_garage',
        alternativePoiIds: [],
        inOneRound: false,
        targetItemId: 'item_microchip',
        count: 2,
      },
    ],
    itemsToBring: [],
  },
  'quest_back_on_top': {
    titleEs: 'De Vuelta en la Cima',
    objectives: [
      {
        id: 'obj_bot_1',
        description: {
          en: 'Tag the exterior foundation wall at Pattern House with neon spray paint',
          es: 'Pinta el muro de cimientos de la Casa de Patrones con spray de pintura neón',
        },
        type: 'sabotage',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_pattern_house',
        alternativePoiIds: [],
        inOneRound: false,
        requiredItemId: 'item_spray_can',
        count: 1,
      },
      {
        id: 'obj_bot_2',
        description: {
          en: 'Spray-paint the Buried Properties billboard mural near Galleria',
          es: 'Pinta el mural publicitario de Propiedades Enterradas cerca de la Galería',
        },
        type: 'sabotage',
        mapId: 'buried_city',
        poiId: 'city_galleria',
        alternativePoiIds: [],
        inOneRound: false,
        requiredItemId: 'item_spray_can',
        count: 1,
      },
    ],
    itemsToBring: [
      { itemId: 'item_spray_can', count: 2, optional: false },
    ],
  },
  'quest_power_grid': {
    titleEs: 'Recuperando la Red',
    objectives: [
      {
        id: 'obj_grid_1',
        description: {
          en: 'Reboot the emergency turbine switch at Power Generation Complex',
          es: 'Reinicia el interruptor de emergencia en el Complejo de Generación Eléctrica',
        },
        type: 'sabotage',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_power_plant',
        alternativePoiIds: [],
        inOneRound: false,
        count: 1,
      },
      {
        id: 'obj_grid_2',
        description: {
          en: 'Verify water cooling pressure in Hydroponic Dome Complex',
          es: 'Verifica la presión de refrigeración en las Cúpulas Hidropónicas',
        },
        type: 'recon',
        mapId: 'dam_battlegrounds',
        poiId: 'dam_hydroponic_dome',
        alternativePoiIds: [],
        inOneRound: false,
        count: 1,
      },
    ],
    itemsToBring: [],
  },
};

async function fetchWikiPages() {
  console.log('[Wiki Scraper] Fetching category members for Category:Quests...');
  const listUrl = 'https://arcraiders.wiki/w/api.php?action=query&list=categorymembers&cmtitle=Category:Quests&cmlimit=500&format=json';
  const listRes = await fetch(listUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const listData = await listRes.json();
  const members = listData.query.categorymembers.filter((m) => m.ns === 0);
  console.log(`[Wiki Scraper] Found ${members.length} main quest articles in Category:Quests.`);

  const titles = members.map((m) => m.title);
  const wikiPages = {};

  for (let i = 0; i < titles.length; i += 30) {
    const chunk = titles.slice(i, i + 30);
    const url = 'https://arcraiders.wiki/w/api.php?action=query&prop=revisions&rvprop=content&titles=' +
      encodeURIComponent(chunk.join('|')) + '&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const json = await res.json();
    for (const page of Object.values(json.query.pages)) {
      if (page.revisions && page.revisions[0]) {
        wikiPages[page.title] = page.revisions[0]['*'];
      }
    }
  }

  console.log(`[Wiki Scraper] Successfully downloaded content for ${Object.keys(wikiPages).length} pages.`);
  return wikiPages;
}

function parseQuest(title, wikitext, existingQuestsMap) {
  // 1. Infobox parsing
  const traderMatch = wikitext.match(/\|\s*(?:trader|vendor)\s*=\s*([^|\n]+)/i);
  let vendor = traderMatch ? traderMatch[1].trim() : 'Other';
  const vendorCanonical = VENDORS.find((v) => v.toLowerCase() === vendor.toLowerCase());
  vendor = vendorCanonical || (vendor === 'Other' ? 'Other' : 'Other');

  const locMatch = wikitext.match(/\|\s*location\s*=\s*([^|\n]+)/i);
  let rawLoc = locMatch ? locMatch[1].trim() : 'Any';
  let mapId = 'any';
  const locLower = rawLoc.toLowerCase();
  for (const [key, val] of Object.entries(MAP_NAME_TO_ID)) {
    if (locLower === key) {
      mapId = val;
      break;
    }
  }

  // 2. Introduction Dialog
  let intro = '';
  const introMatch = wikitext.match(/'''Intro(?:duction)?:?'''\s*<blockquote>([\s\S]*?)<\/blockquote>/i);
  if (introMatch) {
    intro = cleanWikitext(introMatch[1]);
  } else {
    const dialogSection = wikitext.match(/== Dialog(?:ue)? ==[\s\S]*?(?===|$)/i);
    if (dialogSection) {
      const bq = dialogSection[0].match(/<blockquote>([\s\S]*?)<\/blockquote>/i);
      if (bq) intro = cleanWikitext(bq[1]);
    }
  }

  if (!intro) {
    intro = `Official contract issued by ${vendor} for operations in ${rawLoc || 'the field'}.`;
  }

  // 3. Objectives
  const isOverallInOneRound = /preset\s*=\s*in-one-round/i.test(wikitext) || /in a single round/i.test(wikitext);
  const objectives = [];

  const objRegex = /\{\{QuestObjective\s*\|\s*(?:label\s*=\s*)?([^|}]+)(?:\|([^}]+))?\}\}/gi;
  let match;
  let objIndex = 1;
  const slug = slugify(title);

  while ((match = objRegex.exec(wikitext)) !== null) {
    const rawLabel = match[1];
    const extraParams = match[2] || '';
    const cleanLabel = cleanWikitext(rawLabel);
    if (!cleanLabel) continue;

    const inOneRound = isOverallInOneRound || /preset=in-one-round/i.test(extraParams) || /in a single round/i.test(cleanLabel);
    const objMap = determineObjectiveMap(cleanLabel, mapId);
    const type = inferQuestType(cleanLabel);

    objectives.push({
      id: `obj_${slug}_${objIndex++}`,
      description: {
        en: cleanLabel,
        es: cleanLabel,
      },
      type,
      mapId: objMap,
      alternativePoiIds: [],
      inOneRound,
      count: 1,
    });
  }

  if (objectives.length === 0) {
    const objSection = wikitext.match(/== Objectives ==[\s\S]*?(?===|$)/i);
    if (objSection) {
      const lines = objSection[0].split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('*') || l.startsWith('#'))
        .map((l) => cleanWikitext(l.replace(/^[*#]\s*/, '')));
      for (const line of lines) {
        if (!line) continue;
        objectives.push({
          id: `obj_${slug}_${objIndex++}`,
          description: { en: line, es: line },
          type: inferQuestType(line),
          mapId: determineObjectiveMap(line, mapId),
          alternativePoiIds: [],
          inOneRound: isOverallInOneRound,
          count: 1,
        });
      }
    }
  }

  if (objectives.length === 0) {
    objectives.push({
      id: `obj_${slug}_1`,
      description: {
        en: `Complete mission objectives for ${vendor} in ${rawLoc}`,
        es: `Completar objetivos de misión para ${vendor} en ${rawLoc}`,
      },
      type: 'recon',
      mapId,
      alternativePoiIds: [],
      inOneRound: isOverallInOneRound,
      count: 1,
    });
  }

  // 4. Rewards
  let xp = undefined;
  const xpMatch = wikitext.match(/\{\{XP\|(\d+)\}\}/i) || wikitext.match(/\|\s*xp\s*=\s*(\d+)/i);
  if (xpMatch) xp = parseInt(xpMatch[1], 10);

  let currency = undefined;
  const currMatch = wikitext.match(/\{\{Currency\|(\d+)\}\}/i) ||
    wikitext.match(/\{\{Creds\|(\d+)\}\}/i) ||
    wikitext.match(/\|\s*(?:currency|creds)\s*=\s*(\d+)/i) ||
    wikitext.match(/(\d+)\s*(?:Credits|K-Credits)/i);
  if (currMatch) currency = parseInt(currMatch[1], 10);

  const rewardItems = [];
  const rewardRegex = /\{\{Quest item\|reward\|([^|}]+)(?:\|qty=(\d+))?(?:\|[^}]+)?\}\}/gi;
  let rewMatch;
  while ((rewMatch = rewardRegex.exec(wikitext)) !== null) {
    const itemName = cleanWikitext(rewMatch[1]);
    const qty = rewMatch[2] ? parseInt(rewMatch[2], 10) : 1;
    if (itemName && !itemName.toLowerCase().includes('xp') && !itemName.toLowerCase().includes('currency')) {
      rewardItems.push(qty > 1 ? `${qty}× ${itemName}` : itemName);
    }
  }

  const questItemsRegex = /\{\{QuestItems\|reward\s*([\s\S]*?)\}\}/gi;
  let qiMatch;
  while ((qiMatch = questItemsRegex.exec(wikitext)) !== null) {
    const lines = qiMatch[1].split('|').map((l) => cleanWikitext(l.replace(/^\s*\*\s*/, '')));
    for (const item of lines) {
      if (item && !item.toLowerCase().startsWith('xp') && !item.toLowerCase().startsWith('currency')) {
        rewardItems.push(item);
      }
    }
  }

  // 5. Existing quest preservation & overrides
  const existing = existingQuestsMap.get(title.toLowerCase().trim());
  const questId = existing ? existing.id : `quest_${slug}`;

  const titleEs = existing?.title?.es && existing.title.es !== existing.title.en
    ? existing.title.es
    : title;

  const quest = {
    id: questId,
    title: {
      en: title,
      es: titleEs,
    },
    description: {
      en: intro,
      es: intro,
    },
    vendor,
    requiredLevel: existing?.requiredLevel || 1,
    objectives,
    itemsToBring: existing?.itemsToBring || [],
    rewards: {
      xp: xp || existing?.rewards?.xp || 1000,
      currency: currency || existing?.rewards?.currency || 2000,
      items: rewardItems.length > 0 ? rewardItems : (existing?.rewards?.items || []),
    },
  };

  // Apply tactical test override if defined
  if (TACTICAL_QUEST_OVERRIDES[questId]) {
    const override = TACTICAL_QUEST_OVERRIDES[questId];
    if (override.titleEs) quest.title.es = override.titleEs;
    if (override.objectives) quest.objectives = override.objectives;
    if (override.itemsToBring) quest.itemsToBring = override.itemsToBring;
  }

  return quest;
}

async function run() {
  const questsFilePath = path.join(__dirname, 'src', 'data', 'quests.json');
  const existingQuests = JSON.parse(fs.readFileSync(questsFilePath, 'utf8'));
  const existingMap = new Map();
  for (const q of existingQuests) {
    existingMap.set(q.title.en.toLowerCase().trim(), q);
  }

  const wikiPages = await fetchWikiPages();
  const parsedQuests = [];
  const processedTitles = new Set();

  for (const [title, wt] of Object.entries(wikiPages)) {
    const q = parseQuest(title, wt, existingMap);
    parsedQuests.push(q);
    processedTitles.add(title.toLowerCase().trim());
  }

  // Retain non-wiki tactical quests needed by items.json and tests
  const REQUIRED_EXISTING_IDS = [
    'quest_power_grid',
    'quest_hunt_heavy_arc',
    'quest_metro_recon',
  ];

  for (const reqId of REQUIRED_EXISTING_IDS) {
    if (!parsedQuests.some((q) => q.id === reqId)) {
      const orig = existingQuests.find((q) => q.id === reqId);
      if (orig && !processedTitles.has(orig.title.en.toLowerCase().trim())) {
        const qClone = JSON.parse(JSON.stringify(orig));
        if (TACTICAL_QUEST_OVERRIDES[reqId]) {
          const override = TACTICAL_QUEST_OVERRIDES[reqId];
          if (override.objectives) qClone.objectives = override.objectives;
          if (override.titleEs) qClone.title.es = override.titleEs;
        }
        if (!qClone.description) {
          qClone.description = {
            en: `Special operation from ${qClone.vendor}.`,
            es: `Operación especial de ${qClone.vendor}.`,
          };
        }
        parsedQuests.push(qClone);
        processedTitles.add(orig.title.en.toLowerCase().trim());
      }
    }
  }

  // Sort alphabetically by English title
  parsedQuests.sort((a, b) => a.title.en.localeCompare(b.title.en));

  console.log(`[Wiki Scraper] Writing ${parsedQuests.length} parsed quests to ${questsFilePath}...`);
  fs.writeFileSync(questsFilePath, JSON.stringify(parsedQuests, null, 2) + '\n', 'utf8');
  console.log('[Wiki Scraper] Successfully updated quests.json with real wiki data!');
}

run().catch((err) => {
  console.error('[Wiki Scraper Error]', err);
  process.exit(1);
});
