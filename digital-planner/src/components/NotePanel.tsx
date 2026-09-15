import { useEffect, useRef, useState } from 'react'
import InkCanvas from './InkCanvas'
import { loadQuickNote, saveQuickNote } from '../lib/notesDb'

type Props = {
  noteId: string
  title: string
  subtitle?: string
  onClose: () => void
}

const AUTOSAVE_DELAY_MS = 600

export default function NotePanel({ noteId, title, subtitle, onClose }: Props) {
  const [text, setText] = useState('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    loadQuickNote(noteId).then((note) => {
      if (!cancelled) setText(note?.text ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [noteId])

  const handleTextChange = (value: string) => {
    setText(value)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveQuickNote(noteId, value), AUTOSAVE_DELAY_MS)
  }

  return (
    <div className="note-panel__backdrop" onClick={onClose}>
      <div className="note-panel" onClick={(e) => e.stopPropagation()}>
        <header className="note-panel__header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="note-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="note-panel__section">
          <label className="note-panel__label" htmlFor="quick-note">
            Quick note <span>(type or write with your tablet's handwriting keyboard)</span>
          </label>
          <textarea
            id="quick-note"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Tap here, then switch your keyboard to handwriting mode…"
            rows={3}
          />
        </section>

        <section className="note-panel__section">
          <label className="note-panel__label">
            Handwritten notes <span>(write directly with your stylus)</span>
          </label>
          <InkCanvas noteId={noteId} height={320} />
        </section>
      </div>
    </div>
  )
}
