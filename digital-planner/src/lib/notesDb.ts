import { createStore, get, set, del, keys } from 'idb-keyval'

// A dedicated IndexedDB store, separate from any other app data, so notes
// survive reloads and (mostly) survive being offline — everything here is
// local to this device, nothing syncs to Google.
const notesStore = createStore('digital-planner-notes', 'notes')

export type InkNote = {
  key: string // e.g. "day:2026-09-21" or "event:<googleEventId>"
  strokesSvgPaths: string[] // one SVG path 'd' string per stroke
  updatedAt: number
}

export type QuickNote = {
  key: string
  text: string
  updatedAt: number
}

const inkKey = (id: string) => `ink:${id}`
const textKey = (id: string) => `text:${id}`

export async function loadInkNote(id: string): Promise<InkNote | undefined> {
  return get(inkKey(id), notesStore)
}

export async function saveInkNote(id: string, strokesSvgPaths: string[]): Promise<void> {
  const note: InkNote = { key: id, strokesSvgPaths, updatedAt: Date.now() }
  await set(inkKey(id), note, notesStore)
}

export async function clearInkNote(id: string): Promise<void> {
  await del(inkKey(id), notesStore)
}

export async function loadQuickNote(id: string): Promise<QuickNote | undefined> {
  return get(textKey(id), notesStore)
}

export async function saveQuickNote(id: string, text: string): Promise<void> {
  const note: QuickNote = { key: id, text, updatedAt: Date.now() }
  await set(textKey(id), note, notesStore)
}

export async function hasAnyNoteFor(id: string): Promise<boolean> {
  const [ink, text] = await Promise.all([loadInkNote(id), loadQuickNote(id)])
  return Boolean(ink?.strokesSvgPaths.length || text?.text.trim())
}

export async function allNoteKeys(): Promise<string[]> {
  const all = await keys(notesStore)
  return all.map(String)
}
