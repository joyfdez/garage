#!/usr/bin/env tsx
/**
 * scripts/import-catalog.ts
 *
 * Carga logos, descripciones y fotos de catálogo desde disco local a Supabase.
 * Nunca crea filas en makes/models/car_models; solo actualiza contenido existente.
 *
 * Uso:
 *   tsx scripts/import-catalog.ts            → corrida real
 *   tsx scripts/import-catalog.ts --dry-run  → preview sin escrituras
 *
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (en entorno o scripts/.env)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'

// ── Paths ──────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CATALOG_ROOT =
  '/Users/rodrigofernandez/Documents/AUTO DB/garage_catalog_estructura/uploads'

// ── .env loader ────────────────────────────────────────────────────────────
// Reads scripts/.env if env vars aren't already set; never overrides real env.

function loadEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

// ── Config & Supabase client ───────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Types ──────────────────────────────────────────────────────────────────

interface Summary {
  makes: { processed: number; withLogo: number; noLogo: number; errors: string[] }
  models: { applied: number; errors: string[] }
  carModels: {
    descriptions: number
    covers: number
    galleryPhotos: number
    skippedDraft: number
    errors: string[]
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Files/dirs to ignore everywhere
function isIgnored(name: string): boolean {
  return (
    name.startsWith('_') ||
    name.endsWith('.txt') ||
    name === 'QA_REPORT.md'
  )
}

// Strips leading "# Heading" line and HTML comments from markdown
function cleanMarkdown(raw: string): string {
  return raw
    .replace(/^#[^\n]*\n?/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

const CONTENT_TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

// Uploads a local file to Storage bucket 'catalog'.
// In dry-run mode, only logs what it would do.
async function uploadToStorage(storagePath: string, localPath: string, ext: string): Promise<void> {
  const contentType = CONTENT_TYPES[ext.toLowerCase()] ?? 'application/octet-stream'
  if (DRY_RUN) {
    console.log(`      [DRY] storage.upload → catalog/${storagePath}`)
    return
  }
  const buffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage
    .from('catalog')
    .upload(storagePath, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Storage upload failed (${storagePath}): ${error.message}`)
}

// ── MAKES ──────────────────────────────────────────────────────────────────

async function processMakes(summary: Summary) {
  const makesDir = path.join(CATALOG_ROOT, 'makes')
  if (!fs.existsSync(makesDir)) {
    console.log('⚠️  Carpeta makes/ no encontrada, saltando.')
    return
  }

  const slugs = fs
    .readdirSync(makesDir)
    .filter((d) => !isIgnored(d) && fs.statSync(path.join(makesDir, d)).isDirectory())

  console.log(`\n📁 MAKES — ${slugs.length} carpetas\n`)

  for (const slug of slugs) {
    summary.makes.processed++
    const makeDir = path.join(makesDir, slug)

    // Resolve slug → DB row
    const { data: make, error } = await supabase
      .from('makes')
      .select('id')
      .eq('slug', slug)
      .single()

    if (error || !make) {
      console.error(`  ❌ make not found in DB: ${slug}`)
      summary.makes.errors.push(`makes/${slug}`)
      continue
    }

    // Find logo: svg → png → webp (skip logo-alt.*)
    const logoExts = ['svg', 'png', 'webp'] as const
    let logoFile: string | null = null
    let logoExt = ''
    for (const ext of logoExts) {
      const candidate = path.join(makeDir, `logo.${ext}`)
      if (fs.existsSync(candidate)) {
        logoFile = candidate
        logoExt = ext
        break
      }
    }

    if (!logoFile) {
      console.log(`  ℹ️  ${slug}: sin logo (esperado)`)
      summary.makes.noLogo++
      continue
    }

    const storagePath = `makes/${slug}/logo.${logoExt}`
    console.log(`  ↑ ${slug}: logo.${logoExt}`)

    try {
      await uploadToStorage(storagePath, logoFile, logoExt)

      if (!DRY_RUN) {
        const { error: dbErr } = await supabase
          .from('makes')
          .update({ logo_path: storagePath })
          .eq('id', make.id)
        if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`)
      } else {
        console.log(`      [DRY] UPDATE makes SET logo_path = '${storagePath}'`)
      }

      summary.makes.withLogo++
    } catch (e) {
      console.error(`  ❌ ${slug}: ${(e as Error).message}`)
      summary.makes.errors.push(`makes/${slug}`)
    }
  }
}

// ── MODELS ─────────────────────────────────────────────────────────────────

async function processModels(summary: Summary) {
  const modelsDir = path.join(CATALOG_ROOT, 'models')
  if (!fs.existsSync(modelsDir)) {
    console.log('⚠️  Carpeta models/ no encontrada, saltando.')
    return
  }

  const slugs = fs
    .readdirSync(modelsDir)
    .filter((d) => !isIgnored(d) && fs.statSync(path.join(modelsDir, d)).isDirectory())

  console.log(`\n📁 MODELS — ${slugs.length} carpetas\n`)

  for (const modelSlug of slugs) {
    const modelDir = path.join(modelsDir, modelSlug)

    // Resolve slug → DB row
    const { data: model, error } = await supabase
      .from('models')
      .select('id')
      .eq('slug', modelSlug)
      .single()

    if (error || !model) {
      console.error(`  ❌ model not found in DB: ${modelSlug}`)
      summary.models.errors.push(`models/${modelSlug}`)
      continue
    }

    // models.description
    const descPath = path.join(modelDir, 'description.md')
    if (fs.existsSync(descPath)) {
      const body = cleanMarkdown(fs.readFileSync(descPath, 'utf-8'))
      if (body) {
        if (!DRY_RUN) {
          const { error: dbErr } = await supabase
            .from('models')
            .update({ description: body })
            .eq('id', model.id)
          if (dbErr) {
            console.error(`  ❌ ${modelSlug}: description update failed: ${dbErr.message}`)
            summary.models.errors.push(`models/${modelSlug}`)
            continue
          }
        } else {
          console.log(`  [DRY] ${modelSlug}: UPDATE models SET description (${body.length} chars)`)
        }
        console.log(`  ✓ ${modelSlug}: description`)
        summary.models.applied++
      }
    }

    // car_models nested under this model folder
    await processCarModels(modelDir, modelSlug, summary)
  }
}

// ── CAR_MODELS ─────────────────────────────────────────────────────────────

async function processCarModels(modelDir: string, modelSlug: string, summary: Summary) {
  const carModelsDir = path.join(modelDir, 'car_models')
  if (!fs.existsSync(carModelsDir)) return

  const slugs = fs
    .readdirSync(carModelsDir)
    .filter((d) => !isIgnored(d) && fs.statSync(path.join(carModelsDir, d)).isDirectory())

  for (const cmSlug of slugs) {
    const cmDir = path.join(carModelsDir, cmSlug)

    // ── meta.yml ──────────────────────────────────────────────────────────
    const metaPath = path.join(cmDir, 'meta.yml')
    if (!fs.existsSync(metaPath)) {
      console.log(`  ⚠️  ${modelSlug}/${cmSlug}: meta.yml no encontrado, saltando`)
      summary.carModels.errors.push(`car_models/${cmSlug} (sin meta.yml)`)
      continue
    }

    let meta: { model_slug?: string; status?: string } = {}
    try {
      meta = (yaml.load(fs.readFileSync(metaPath, 'utf-8')) ?? {}) as typeof meta
    } catch (e) {
      console.error(`  ❌ ${modelSlug}/${cmSlug}: meta.yml parse error: ${(e as Error).message}`)
      summary.carModels.errors.push(`car_models/${cmSlug} (meta.yml inválido)`)
      continue
    }

    if (meta.status !== 'approved') {
      // Draft or missing status — skip silently (count only)
      summary.carModels.skippedDraft++
      continue
    }

    // ── Resolve car_model slug → DB row ───────────────────────────────────
    const { data: cm, error } = await supabase
      .from('car_models')
      .select('id')
      .eq('slug', cmSlug)
      .single()

    if (error || !cm) {
      console.error(`  ❌ car_model not found in DB: ${cmSlug}`)
      summary.carModels.errors.push(`car_models/${cmSlug}`)
      continue
    }

    console.log(`  → ${cmSlug}`)

    const updates: Record<string, string> = {}

    // ── description ───────────────────────────────────────────────────────
    const descPath = path.join(cmDir, 'description.md')
    if (fs.existsSync(descPath)) {
      const body = cleanMarkdown(fs.readFileSync(descPath, 'utf-8'))
      if (body) {
        updates.description = body
        summary.carModels.descriptions++
      }
    }

    // ── cover.jpg ─────────────────────────────────────────────────────────
    const coverPath = path.join(cmDir, 'cover.jpg')
    if (fs.existsSync(coverPath)) {
      const storagePath = `car_models/${cmSlug}/cover.jpg`
      try {
        await uploadToStorage(storagePath, coverPath, 'jpg')
        updates.cover_photo_path = storagePath
        summary.carModels.covers++
        console.log(`      ↑ cover`)
      } catch (e) {
        console.error(`      ❌ cover upload failed: ${(e as Error).message}`)
      }
    }

    // ── Apply description + cover to DB ───────────────────────────────────
    if (Object.keys(updates).length > 0) {
      if (!DRY_RUN) {
        const { error: dbErr } = await supabase
          .from('car_models')
          .update(updates)
          .eq('id', cm.id)
        if (dbErr) {
          console.error(`      ❌ car_models update failed: ${dbErr.message}`)
          summary.carModels.errors.push(`car_models/${cmSlug}`)
          continue
        }
      } else {
        console.log(`      [DRY] UPDATE car_models SET ${Object.keys(updates).join(', ')}`)
      }
    }

    // ── Gallery photos (gallery-NN.jpg) ───────────────────────────────────
    const galleryFiles = fs
      .readdirSync(cmDir)
      .filter((f) => /^gallery-\d{2}\.(jpg|jpeg)$/i.test(f))
      .sort()

    if (galleryFiles.length > 0) {
      // Delete existing gallery rows first (idempotency)
      if (!DRY_RUN) {
        const { error: delErr } = await supabase
          .from('model_photos')
          .delete()
          .eq('car_model_id', cm.id)
        if (delErr) {
          console.error(`      ❌ gallery delete failed: ${delErr.message}`)
          summary.carModels.errors.push(`car_models/${cmSlug} (gallery delete)`)
          continue
        }
      } else {
        console.log(`      [DRY] DELETE model_photos WHERE car_model_id = ${cm.id}`)
      }

      for (const file of galleryFiles) {
        const posMatch = file.match(/gallery-(\d{2})/)
        const position = posMatch ? parseInt(posMatch[1], 10) : 0
        const storagePath = `car_models/${cmSlug}/${file}`

        try {
          await uploadToStorage(storagePath, path.join(cmDir, file), 'jpg')

          if (!DRY_RUN) {
            const { error: insErr } = await supabase
              .from('model_photos')
              .insert({ car_model_id: cm.id, storage_path: storagePath, position })
            if (insErr) throw new Error(insErr.message)
          } else {
            console.log(`      [DRY] INSERT model_photos position=${position} → ${storagePath}`)
          }

          summary.carModels.galleryPhotos++
          console.log(`      ↑ ${file} (pos ${position})`)
        } catch (e) {
          console.error(`      ❌ gallery ${file} failed: ${(e as Error).message}`)
        }
      }
    }
  }
}

// ── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚗  Garage Catalog Import`)
  console.log(`    Modo : ${DRY_RUN ? '🔍 DRY RUN — sin escrituras' : '🟢 LIVE — escribiendo a Supabase'}`)
  console.log(`    Raíz : ${CATALOG_ROOT}\n`)

  const summary: Summary = {
    makes: { processed: 0, withLogo: 0, noLogo: 0, errors: [] },
    models: { applied: 0, errors: [] },
    carModels: { descriptions: 0, covers: 0, galleryPhotos: 0, skippedDraft: 0, errors: [] },
  }

  await processMakes(summary)
  await processModels(summary)

  // ── Resumen ───────────────────────────────────────────────────────────────
  const line = '━'.repeat(50)
  console.log(`\n${line}`)
  console.log('RESUMEN')
  console.log(line)
  console.log(`Makes        procesados : ${summary.makes.processed}`)
  console.log(`             con logo   : ${summary.makes.withLogo}`)
  console.log(`             sin logo   : ${summary.makes.noLogo}`)
  console.log(`             errores    : ${summary.makes.errors.length}`)
  console.log(`\nModels       descripciones : ${summary.models.applied}`)
  console.log(`             errores       : ${summary.models.errors.length}`)
  console.log(`\nCar models   descripciones  : ${summary.carModels.descriptions}`)
  console.log(`             covers         : ${summary.carModels.covers}`)
  console.log(`             fotos galería  : ${summary.carModels.galleryPhotos}`)
  console.log(`             drafts saltados: ${summary.carModels.skippedDraft}`)
  console.log(`             errores        : ${summary.carModels.errors.length}`)

  const allErrors = [
    ...summary.makes.errors,
    ...summary.models.errors,
    ...summary.carModels.errors,
  ]
  if (allErrors.length > 0) {
    console.log(`\n⚠️  Slugs con error:`)
    allErrors.forEach((e) => console.log(`   ${e}`))
  } else {
    console.log('\n✅  Sin errores.')
  }
  console.log(`${line}\n`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
