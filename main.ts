// Vice Cover Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: copy this repository's app/ and screenshots/ into the
// output directory and write output/dossier.json there, using the vendored
// make.fun library's buildDossier. The grader runs this program twice and
// expects both runs to produce identical bytes, so nothing here depends on
// the clock, on randomness, or on the order the filesystem happens to list
// files in. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the kit documents them: the text budget shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse anyway
// (more than four screenshots, a screenshot over 256 KiB, more than 993
// files or 48 MiB under app/, or a path under app/ over 1000 bytes — app/
// shares /output's own 1000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
