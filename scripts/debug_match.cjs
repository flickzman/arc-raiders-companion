const { analyzeQuestsFromText } = require('../src/services/ocr/fuzzyMatcher');
// wait, fuzzyMatcher is TS. Let's see with node:
const userScreenshotDump = `
QUESTS
> A DISTRACT AND DESTROY ARC ENEMIES
> {© SIZING THINGS UP
> +r, REDUCED TO RUBBLE
> f%7 TO THE SKIES
> €) CELESTE'S CHILDHOOD DRAWINGS
> © BOARDING THE FRIGATE
> €) MEDICAL MERCHANDISE
>» +1; CLAMORING FOR ATTENTION
`;

const lines = userScreenshotDump.split('\n');
console.log('Total raw lines:', lines.length);
