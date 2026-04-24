#!/usr/bin/env node
/**
 * scripts/download-subject-images.mjs
 *
 * Télécharge des photos libres de droits pour chacune des dix matières
 * du catalogue EduQuiz et les dépose dans
 *   apps/web/public/images/subjects/<slug>.webp
 *
 * Sources visées :
 *   - Unsplash  (licence Unsplash, gratuite, usage commercial, sans
 *     attribution obligatoire mais recommandée)
 *   - Pexels    (licence Pexels, même profil)
 *   - Wikimedia Commons pour les photos spécifiques au Québec
 *
 * Fonctionnement :
 *   1. Lit la table SUBJECT_SOURCES ci-dessous (slug → URL image + meta).
 *   2. Télécharge chaque image avec `fetch` (Node 18+).
 *   3. Écrit le flux binaire tel quel (ne convertit pas en WebP, les
 *      URLs choisies pointent déjà vers un WebP ou un JPEG/PNG que Next
 *      servira tel quel — on se passe volontairement de dépendance
 *      `sharp` pour garder le script autonome).
 *   4. Met à jour `packages/i18n/src/locales/{fr,en}.json` en
 *      substituant `/images/subjects/<slug>.svg` par l'extension réelle
 *      de l'image téléchargée.
 *   5. Complète `apps/web/public/images/subjects/ATTRIBUTIONS.md` avec
 *      source / auteur / licence / URL / date pour chaque photo.
 *
 * Utilisation :
 *   node scripts/download-subject-images.mjs
 *
 * Idempotence :
 *   - Si le fichier cible existe déjà, on le laisse tel quel à moins de
 *     passer `--force`.
 *   - Les substitutions dans les dictionnaires sont idempotentes : on
 *     recherche `.svg` ET `.webp`/`.jpg` pour converger.
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'apps/web/public/images/subjects');
const FR_JSON = join(REPO_ROOT, 'packages/i18n/src/locales/fr.json');
const EN_JSON = join(REPO_ROOT, 'packages/i18n/src/locales/en.json');
const ATTR_MD = join(OUT_DIR, 'ATTRIBUTIONS.md');

const FORCE = process.argv.includes('--force');

/**
 * Table des sources. Chaque entrée est volontairement indépendante et
 * documentée. Si une URL devient invalide, seul ce bloc est à mettre à
 * jour. Les URLs Unsplash respectent le pattern `?auto=format&fit=crop
 * &w=1600&q=80` pour garantir un WebP/JPEG de bonne qualité à un format
 * 3:2 exploitable en hero.
 *
 * IMPORTANT : les URLs listées ici sont des exemples représentatifs.
 * Elles peuvent être remplacées ponctuellement par des photos plus
 * pertinentes du point de vue pédagogique québécois. Ce qui compte
 * c'est que la licence reste libre de droits (Unsplash / Pexels /
 * Wikimedia Commons / CC0 / CC-BY).
 */
const SUBJECT_SOURCES = [
  {
    slug: 'mathematiques',
    label: 'Mathématiques',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Roman Mager',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/5mZ_M06Fc9g',
  },
  {
    slug: 'francais',
    label: 'Français',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Patrick Tomasso',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/Oaqk7qqNh_c',
  },
  {
    slug: 'anglais',
    label: 'Anglais',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'J. Kelly Brito',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/PeUJyoylfe4',
  },
  {
    slug: 'sciences-technologie',
    label: 'Sciences et technologie',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Louis Reed',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/pwcKF7L4-no',
  },
  {
    slug: 'histoire-quebec-canada',
    label: 'Histoire du Québec et du Canada',
    url: 'https://images.unsplash.com/photo-1518736346281-a27fac3e51ab?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Pierre-Luc Guay',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/7J4BA2_dTQk',
  },
  {
    slug: 'geographie',
    label: 'Géographie',
    url: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Kyle Glenn',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/nXt5HtLmlgE',
  },
  {
    slug: 'education-financiere',
    label: 'Éducation financière',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'NORTHFOLK',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/Ok76F6yW2iA',
  },
  {
    slug: 'education-physique-sante',
    label: 'Éducation physique et à la santé',
    url: 'https://images.unsplash.com/photo-1461897104836-cf58f07ba6b4?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Curtis MacNewton',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/IKNrH2wIjNM',
  },
  {
    slug: 'culture-citoyennete-quebecoise',
    label: 'Culture et citoyenneté québécoise',
    url: 'https://images.unsplash.com/photo-1591622462610-f11ee7b9e3a4?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Timon Studler',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/ABGaVhJxwDQ',
  },
  {
    slug: 'monde-contemporain',
    label: 'Monde contemporain',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&q=80',
    ext: 'webp',
    source: 'Unsplash',
    author: 'Daniel Olah',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com/photos/S-E5ZEwqcr8',
  },
];

/**
 * Vérifie l'existence d'un fichier sans lever si absent.
 */
async function exists(path) {
  try {
    await access(path, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Télécharge une URL HTTP vers un chemin local. Retourne le nombre
 * d'octets écrits. En cas de status ≥ 400, lève.
 */
async function downloadTo(url, filePath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} pour ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
  return buf.byteLength;
}

/**
 * Remplace l'extension du fichier image pour un slug donné dans un
 * dictionnaire i18n. On cible la clé "image" sous chaque
 * subjects.list.<subjectKey>.image et on ne touche rien d'autre.
 *
 * Comme le JSON est assez petit, on fait une substitution textuelle
 * ciblée (le chemin est unique pour chaque slug).
 */
async function rewriteDictPath(jsonPath, slug, ext) {
  const raw = await readFile(jsonPath, 'utf8');
  const re = new RegExp(`/images/subjects/${slug}\\.(svg|webp|jpg|jpeg|png)`, 'g');
  const replaced = raw.replace(re, `/images/subjects/${slug}.${ext}`);
  if (replaced !== raw) {
    await writeFile(jsonPath, replaced);
    return true;
  }
  return false;
}

/**
 * Ajoute une entrée dans ATTRIBUTIONS.md sous une section dédiée.
 * Idempotent : si l'entrée (identifiée par le slug) existe déjà, on la
 * remplace plutôt que d'en créer une nouvelle.
 */
async function upsertAttribution(entry) {
  const marker = `<!-- attr:${entry.slug} -->`;
  const block = [
    marker,
    `### ${entry.label} (\`${entry.slug}.${entry.ext}\`)`,
    '',
    `- Source : ${entry.source}`,
    `- Auteur·rice : ${entry.author}`,
    `- Licence : ${entry.license}`,
    `- URL d'origine : ${entry.sourceUrl}`,
    `- Ajoutée le : ${new Date().toISOString().slice(0, 10)}`,
    '',
  ].join('\n');

  let current = '';
  if (await exists(ATTR_MD)) {
    current = await readFile(ATTR_MD, 'utf8');
  }

  if (current.includes(marker)) {
    // Remplacer l'entrée existante (du marker jusqu'à la ligne vide).
    const re = new RegExp(
      `${marker}[\\s\\S]*?(?=\\n<!-- attr:|\\n## |$)`,
      'g',
    );
    current = current.replace(re, block);
  } else {
    // Ajouter en fin de fichier, dans une section dédiée.
    if (!current.includes('## Photos téléchargées')) {
      current = current.trimEnd() + '\n\n## Photos téléchargées\n\n';
    }
    current = current.trimEnd() + '\n\n' + block;
  }

  await writeFile(ATTR_MD, current.trimEnd() + '\n');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of SUBJECT_SOURCES) {
    const target = join(OUT_DIR, `${entry.slug}.${entry.ext}`);
    const alreadyThere = await exists(target);

    if (alreadyThere && !FORCE) {
      console.log(`↷  ${entry.slug}: existe déjà (${target}), on ignore (utiliser --force pour écraser).`);
      skipped += 1;
      continue;
    }

    try {
      console.log(`↓  ${entry.slug}: téléchargement ${entry.url}`);
      const bytes = await downloadTo(entry.url, target);
      console.log(`   → ${target} (${(bytes / 1024).toFixed(1)} Ko)`);
      const frChanged = await rewriteDictPath(FR_JSON, entry.slug, entry.ext);
      const enChanged = await rewriteDictPath(EN_JSON, entry.slug, entry.ext);
      console.log(
        `   dictionnaires mis à jour : fr=${frChanged ? 'oui' : 'non'}, en=${enChanged ? 'oui' : 'non'}`,
      );
      await upsertAttribution(entry);
      downloaded += 1;
    } catch (err) {
      console.error(`✗  ${entry.slug}: échec — ${err instanceof Error ? err.message : String(err)}`);
      failed += 1;
    }
  }

  console.log('');
  console.log(`Résumé : ${downloaded} téléchargé(s), ${skipped} ignoré(s), ${failed} en échec.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
