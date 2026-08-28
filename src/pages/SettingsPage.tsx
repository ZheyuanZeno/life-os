import { useLiveQuery } from 'dexie-react-hooks'
import { Database, Download, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, PageHeader, SectionHeader } from '../components/ui'
import { db } from '../db/database'
import { removeDemoData, restoreDemoData } from '../db/seed'
import { useI18n } from '../i18n'

export function SettingsPage() {
  const { t } = useI18n()
  const setting = useLiveQuery(() => db.appSettings.get('demoDataState'), [])
  const [busy, setBusy] = useState(false)
  async function exportData() {
    const payload = { schemaVersion: 2, exportedAt: new Date().toISOString(), goals: await db.goals.toArray(), projects: await db.projects.toArray(), tasks: await db.tasks.toArray(), milestones: await db.milestones.toArray(), metricDefinitions: await db.metricDefinitions.toArray(), metricEntries: await db.metricEntries.toArray(), achievements: await db.achievements.toArray(), goalNotes: await db.goalNotes.toArray(), dailyJournals: await db.dailyJournals.toArray(), thoughts: await db.thoughts.toArray(), weeklyReviews: await db.weeklyReviews.toArray() }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `life-os-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url)
  }
  return <div className="page settings-page"><PageHeader eyebrow={t('settings.eyebrow')} title={t('settings.title')} description={t('settings.description')} /><Card><SectionHeader title={t('settings.localData')} /><div className="settings-row"><span className="settings-icon"><Database size={19} /></span><div><strong>{t('settings.indexedDb')}</strong><p>{t('settings.indexedDbDescription')}</p></div><Button variant="secondary" onClick={() => void exportData()}><Download size={15} /> {t('settings.export')}</Button></div></Card><Card><SectionHeader title={t('settings.demoData')} /><div className="settings-row"><span className="settings-icon"><RotateCcw size={19} /></span><div><strong>{setting?.value === 'removed' ? t('settings.demoRemoved') : t('settings.demoActive')}</strong><p>{t('settings.demoDescription')}</p></div>{setting?.value === 'removed' ? <Button disabled={busy} onClick={async () => { setBusy(true); await restoreDemoData(); setBusy(false) }}><RotateCcw size={15} /> {t('settings.restore')}</Button> : <Button variant="danger" disabled={busy} onClick={async () => { if (!window.confirm(t('settings.removeConfirm'))) return; setBusy(true); await removeDemoData(); setBusy(false) }}><Trash2 size={15} /> {t('settings.remove')}</Button>}</div></Card><p className="settings-note">{t('settings.note')}</p></div>
}
