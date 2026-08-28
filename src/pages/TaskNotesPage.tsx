import { useLiveQuery } from 'dexie-react-hooks'
import { Check, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Card, Field, PageHeader } from '../components/ui'
import { db, timestamp } from '../db/database'
import { friendlyDateTime } from '../lib/date'
import { useI18n } from '../i18n'

export function TaskNotesPage() {
  const setting = useLiveQuery(async () => await db.appSettings.get('taskOrganizerMemo') ?? null, [])
  const { t } = useI18n()
  if (setting === undefined) return <div className="page loading-page">{t('common.loading')}</div>
  return <TaskNotesEditor initialValue={setting?.value ?? ''} initialUpdatedAt={setting?.updatedAt ?? null} />
}

function TaskNotesEditor({ initialValue, initialUpdatedAt }: { initialValue: string; initialUpdatedAt: string | null }) {
  const { t, language } = useI18n()
  const [value, setValue] = useState(initialValue)
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
  const [saving, setSaving] = useState(false)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    setSaving(true)
    const timer = window.setTimeout(async () => {
      const now = timestamp()
      await db.appSettings.put({ key: 'taskOrganizerMemo', value, updatedAt: now })
      setUpdatedAt(now); setSaving(false)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [value])
  return <div className="page task-notes-page"><PageHeader eyebrow={t('taskNotes.eyebrow')} title={t('taskNotes.title')} description={t('taskNotes.description')} /><Card className="task-notes-card"><Field label={t('taskNotes.label')}><textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder={t('taskNotes.placeholder')} /></Field><div className="task-notes-status" aria-live="polite">{saving ? t('taskNotes.saving') : updatedAt ? <><Check size={14} /> {t('taskNotes.lastSaved', { time: friendlyDateTime(updatedAt, language) })}</> : <><FileText size={14} /> {t('taskNotes.empty')}</>}</div></Card></div>
}
