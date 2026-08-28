import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Lightbulb, Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Field, Modal, PageHeader, Pill, SectionHeader } from '../components/ui'
import { db } from '../db/database'
import { saveJournal, updateJournal, updateThought } from '../db/repositories'
import { friendlyDate, friendlyDateTime, todayKey } from '../lib/date'
import { useI18n } from '../i18n'
import { useUIStore } from '../store/ui'
import type { DailyJournal, Thought } from '../types'

export function JournalPage() {
  const { t, language } = useI18n()
  const data = useLiveQuery(async () => ({ journals: await db.dailyJournals.orderBy('createdAt').reverse().toArray(), thoughts: await db.thoughts.orderBy('createdAt').reverse().toArray() }), [])
  const openCapture = useUIStore((state) => state.openCapture)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [announcement, setAnnouncement] = useState('')
  const [editingJournal, setEditingJournal] = useState<DailyJournal | null>(null)
  const [editingThought, setEditingThought] = useState<Thought | null>(null)
  if (!data) return <div className="page loading-page">{t('journal.loading')}</div>

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!content.trim()) return
    await saveJournal({ date: todayKey(), content: content.trim(), mood, energy, demoSetId: null })
    setContent(''); setMood(3); setEnergy(3); setAnnouncement(t('journal.entrySaved'))
    window.setTimeout(() => setAnnouncement(''), 1800)
  }

  return <div className="page"><PageHeader eyebrow={t('journal.eyebrow')} title={t('journal.title')} description={t('journal.recordsDescription')} actions={<Button variant="secondary" onClick={() => openCapture('thought')}><Plus size={16} /> {t('journal.captureThought')}</Button>} />
    <div className="journal-grid"><Card className="journal-editor"><SectionHeader title={t('journal.newEntry')} meta={friendlyDate(todayKey(), language)} /><form onSubmit={submit} className="form-stack"><Field label={t('journal.prompt')}><textarea rows={9} value={content} onChange={(event) => setContent(event.target.value)} placeholder={t('journal.placeholder')} /></Field><div className="rating-grid"><Rating label={t('journal.mood')} value={mood} onChange={setMood} /><Rating label={t('journal.energy')} value={energy} onChange={setEnergy} /></div><div className="save-row"><span aria-live="polite">{announcement}</span><Button type="submit" disabled={!content.trim()}><Save size={15} /> {t('journal.save')}</Button></div></form></Card>
      <Card><SectionHeader title={t('journal.thoughts')} meta={`${data.thoughts.length}`} actions={<button className="text-button" onClick={() => openCapture('thought')}>{t('common.add')}</button>} />{data.thoughts.length ? <div className="thought-list editable-records">{data.thoughts.map((thought) => <article key={thought.id}><span><Lightbulb size={16} /></span><button className="record-open" aria-label={`${t('journal.openThought')} · ${thought.title}`} onClick={() => setEditingThought(thought)}><h3>{thought.title}</h3>{thought.content && <p>{thought.content}</p>}<small>{thought.editHistory.length ? t('journal.lastEdited', { time: friendlyDateTime(thought.updatedAt, language) }) : t('journal.created', { time: friendlyDateTime(thought.createdAt, language) })}</small><div>{thought.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div></button></article>)}</div> : <EmptyState title={t('journal.noThoughts')} description={t('journal.noThoughtsDescription')} />}</Card>
    </div>
    <Card className="journal-records"><SectionHeader title={t('journal.entries')} meta={`${data.journals.length}`} />{data.journals.length ? <div className="journal-entry-grid">{data.journals.map((journal) => <button key={journal.id} className="journal-entry-card" aria-label={`${t('journal.openEntry')} · ${friendlyDate(journal.date, language)}`} onClick={() => setEditingJournal(journal)}><div><strong>{friendlyDate(journal.date, language)}</strong><span>{t('journal.rating', { mood: journal.mood, energy: journal.energy })}</span></div><p>{journal.content || t('journal.noReflection')}</p><small><Clock3 size={13} /> {journal.editHistory.length ? t('journal.lastEdited', { time: friendlyDateTime(journal.updatedAt, language) }) : t('journal.created', { time: friendlyDateTime(journal.createdAt, language) })}</small></button>)}</div> : <EmptyState title={t('journal.noEntries')} description={t('journal.noEntriesDescription')} />}</Card>
    {editingJournal && <JournalEditor key={`${editingJournal.id}:${editingJournal.updatedAt}`} journal={editingJournal} onClose={() => setEditingJournal(null)} />}
    {editingThought && <ThoughtEditor key={`${editingThought.id}:${editingThought.updatedAt}`} thought={editingThought} onClose={() => setEditingThought(null)} />}
  </div>
}

function JournalEditor({ journal, onClose }: { journal: DailyJournal; onClose: () => void }) {
  const { t, language } = useI18n()
  const [content, setContent] = useState(journal.content)
  const [date, setDate] = useState(journal.date)
  const [mood, setMood] = useState(journal.mood)
  const [energy, setEnergy] = useState(journal.energy)
  async function submit(event: FormEvent) { event.preventDefault(); if (!content.trim()) return; await updateJournal(journal.id, { date, content: content.trim(), mood, energy, demoSetId: journal.demoSetId ?? null }); onClose() }
  return <Modal open onOpenChange={(open) => !open && onClose()} title={t('journal.editEntry')} description={t('journal.created', { time: friendlyDateTime(journal.createdAt, language) })}><form className="form-stack" onSubmit={submit}><Field label={t('journal.date')}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label={t('journal.prompt')}><textarea autoFocus rows={8} value={content} onChange={(event) => setContent(event.target.value)} /></Field><div className="rating-grid"><Rating label={t('journal.mood')} value={mood} onChange={setMood} /><Rating label={t('journal.energy')} value={energy} onChange={setEnergy} /></div><EditHistory timestamps={journal.editHistory} /><div className="dialog-actions"><Button type="button" variant="danger" onClick={async () => { if (!window.confirm(t('journal.deleteEntryConfirm'))) return; await db.dailyJournals.delete(journal.id); onClose() }}><Trash2 size={15} /> {t('journal.deleteEntry')}</Button><span /><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={!content.trim()}>{t('journal.saveChanges')}</Button></div></form></Modal>
}

function ThoughtEditor({ thought, onClose }: { thought: Thought; onClose: () => void }) {
  const { t, language } = useI18n()
  const [title, setTitle] = useState(thought.title)
  const [content, setContent] = useState(thought.content)
  const [tags, setTags] = useState(thought.tags.join(', '))
  async function submit(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; await updateThought(thought.id, { title: title.trim(), content: content.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), demoSetId: thought.demoSetId ?? null }); onClose() }
  return <Modal open onOpenChange={(open) => !open && onClose()} title={t('journal.editThought')} description={t('journal.created', { time: friendlyDateTime(thought.createdAt, language) })}><form className="form-stack" onSubmit={submit}><Field label={t('capture.title')}><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} /></Field><Field label={t('capture.thoughtLabel')}><textarea rows={7} value={content} onChange={(event) => setContent(event.target.value)} /></Field><Field label={t('capture.tags')} hint={t('capture.tagsHint')}><input value={tags} onChange={(event) => setTags(event.target.value)} /></Field><EditHistory timestamps={thought.editHistory} /><div className="dialog-actions"><Button type="button" variant="danger" onClick={async () => { if (!window.confirm(t('journal.deleteThoughtConfirm', { title: thought.title }))) return; await db.thoughts.delete(thought.id); onClose() }}><Trash2 size={15} /> {t('journal.deleteThought')}</Button><span /><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={!title.trim()}>{t('journal.saveChanges')}</Button></div></form></Modal>
}

function EditHistory({ timestamps }: { timestamps: string[] }) {
  const { t, language } = useI18n()
  if (!timestamps.length) return <p className="record-audit">{t('journal.neverEdited')}</p>
  return <details className="edit-history"><summary>{t('journal.editHistory')} · {t('journal.editedCount', { count: timestamps.length })}</summary><ol>{[...timestamps].reverse().map((timestamp, index) => <li key={`${timestamp}:${index}`}>{friendlyDateTime(timestamp, language)}</li>)}</ol></details>
}

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <fieldset><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((number) => <button type="button" key={number} className={value === number ? 'active' : ''} aria-pressed={value === number} onClick={() => onChange(number)}>{number}</button>)}</div></fieldset>
}
