import { useLiveQuery } from 'dexie-react-hooks'
import { format, parseISO } from 'date-fns'
import { Award, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, EmptyState, PageHeader, Pill } from '../components/ui'
import { db } from '../db/database'
import { friendlyDate } from '../lib/date'
import { localeFor } from '../lib/date'
import { useI18n } from '../i18n'
import { useUIStore } from '../store/ui'

export function AchievementsPage() {
  const { t, label, language } = useI18n()
  const data = useLiveQuery(async () => ({ achievements: await db.achievements.orderBy('date').reverse().toArray(), goals: await db.goals.toArray() }), [])
  const openCapture = useUIStore((state) => state.openCapture)
  const [goalFilter, setGoalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const groups = useMemo(() => {
    if (!data) return []
    const filtered = data.achievements.filter((item) => (!goalFilter || item.goalId === goalFilter) && (!categoryFilter || item.category === categoryFilter))
    const map = new Map<string, typeof filtered>()
    filtered.forEach((item) => { const key = format(parseISO(item.date), language === 'zh' ? 'yyyy年M月' : 'MMMM yyyy', { locale: localeFor(language) }); map.set(key, [...(map.get(key) ?? []), item]) })
    return [...map.entries()]
  }, [data, goalFilter, categoryFilter, language])
  if (!data) return <div className="page loading-page">{t('common.loading')}</div>
  return <div className="page"><PageHeader eyebrow={t('achievements.eyebrow')} title={t('achievements.title')} description={t('achievements.description')} actions={<Button onClick={() => openCapture('achievement')}><Plus size={16} /> {t('achievements.add')}</Button>} /><div className="filter-bar"><select aria-label={t('achievements.filterGoal')} value={goalFilter} onChange={(event) => setGoalFilter(event.target.value)}><option value="">{t('common.allGoals')}</option>{data.goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select><select aria-label={t('achievements.filterCategory')} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">{t('common.allCategories')}</option>{[...new Set(data.achievements.map((item) => item.category))].map((category) => <option key={category} value={category}>{label(category)}</option>)}</select></div>{groups.length ? <div className="timeline">{groups.map(([month, items]) => <section key={month}><h2>{month}</h2><div>{items.map((item) => <article key={item.id} className="timeline-item"><div className="timeline-date"><strong>{format(parseISO(item.date), 'dd')}</strong><span>{format(parseISO(item.date), 'EEE', { locale: localeFor(language) })}</span></div><span className="timeline-marker"><Award size={16} /></span><div className="timeline-copy"><div><h3>{item.title}</h3><Pill tone="accent">{label(item.category)}</Pill></div>{item.description && <p>{item.description}</p>}<small>{friendlyDate(item.date, language)}{item.goalId ? ` · ${data.goals.find((goal) => goal.id === item.goalId)?.title ?? t('achievements.archivedGoal')}` : ''}</small></div><button className="icon-button timeline-delete" aria-label={`${t('common.delete')} ${item.title}`} onClick={() => void db.achievements.delete(item.id)}><Trash2 size={15} /></button></article>)}</div></section>)}</div> : <EmptyState title={t('achievements.noMatch')} description={t('achievements.noMatchDescription')} action={<Button onClick={() => openCapture('achievement')}>{t('achievements.add')}</Button>} />}</div>
}
