import { zodResolver } from '@hookform/resolvers/zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ChevronRight, Edit3, Plus, Target, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button, Card, EmptyState, Field, Modal, PageHeader, Pill, ProgressBar, SectionHeader } from '../components/ui'
import { db } from '../db/database'
import { deleteGoal, deleteMetricEntry, deleteProject, saveGoal, saveGoalNote, saveMetricDefinition, saveMetricEntry, saveProject, setTaskStatus } from '../db/repositories'
import { calculateGoalProgress } from '../lib/calculations'
import { friendlyDate, todayKey } from '../lib/date'
import { useI18n } from '../i18n'
import { useUIStore } from '../store/ui'
import { goalCategories, type Goal, type GoalNote, type GoalStatus, type LifeTask, type MetricDefinition, type MetricEntry, type Project, type TaskStatus } from '../types'

const goalSchema = z.object({
  title: z.string().trim().min(1, 'Add a goal title.').max(120),
  description: z.string().max(1000),
  category: z.enum(goalCategories),
  status: z.enum(['Active', 'Paused', 'Completed', 'Archived']),
  startDate: z.string().min(1),
  targetDate: z.string(),
  progressType: z.enum(['Manual', 'Metric']),
  manualProgress: z.number().min(0).max(100),
  startValue: z.number().nullable(),
  targetValue: z.number().nullable(),
  currentValue: z.number().nullable(),
  unit: z.string(),
})
type GoalForm = z.infer<typeof goalSchema>

export function GoalsPage() {
  const { goalId } = useParams()
  return goalId ? <GoalDetail goalId={goalId} /> : <GoalList />
}

function GoalList() {
  const { t, label } = useI18n()
  const goals = useLiveQuery(() => db.goals.orderBy('updatedAt').reverse().toArray(), []) ?? []
  const [editing, setEditing] = useState<Goal | null | 'new'>(null)
  const grouped = ['Active', 'Paused', 'Completed', 'Archived'] as GoalStatus[]
  return <div className="page"><PageHeader eyebrow={t('goals.eyebrow')} title={t('goals.title')} description={t('goals.description')} actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> {t('goals.new')}</Button>} />{grouped.map((status) => { const items = goals.filter((goal) => goal.status === status); if (!items.length && status !== 'Active') return null; return <section key={status} className="page-section"><SectionHeader title={label(status)} meta={t('common.goalsCount', { count: items.length })} />{items.length ? <div className="goal-card-grid">{items.map((goal) => <Card key={goal.id} className="goal-card"><div className="goal-card-top"><Pill tone="accent">{label(goal.category)}</Pill><button className="icon-button" aria-label={`${t('common.edit')} ${goal.title}`} onClick={() => setEditing(goal)}><Edit3 size={16} /></button></div><Link to={`/goals/${goal.id}`}><h3>{goal.title}</h3><p>{goal.description || t('goals.noDescription')}</p><ProgressBar value={calculateGoalProgress(goal)} /><div className="goal-card-footer"><span>{goal.progressType === 'Metric' ? `${goal.currentValue ?? '—'} ${goal.unit ?? ''} → ${goal.targetValue ?? '—'} ${goal.unit ?? ''}` : t('goals.manualProgress')}</span><ChevronRight size={16} /></div></Link></Card>)}</div> : <EmptyState title={t('goals.noActive')} description={t('goals.noActiveDescription')} action={<Button onClick={() => setEditing('new')}>{t('goals.create')}</Button>} />}</section> })}<GoalEditor open={editing !== null} goal={editing === 'new' ? null : editing} onClose={() => setEditing(null)} /></div>
}

function GoalEditor({ open, goal, onClose }: { open: boolean; goal: Goal | null; onClose: () => void }) {
  const { t, label } = useI18n()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<GoalForm>({ resolver: zodResolver(goalSchema), defaultValues: defaults(goal) })
  const progressType = watch('progressType')
  useEffect(() => reset(defaults(goal)), [goal, reset, open])
  const submit = handleSubmit(async (values) => {
    const saved = await saveGoal({ ...(goal ?? {}), ...values, targetDate: values.targetDate || null, unit: values.unit || null, demoSetId: goal?.demoSetId ?? null, primaryMetricId: goal?.primaryMetricId ?? null })
    onClose()
    if (!goal) navigate(`/goals/${saved.id}`)
  })
  return <Modal open={open} onOpenChange={(value) => !value && onClose()} title={goal ? t('goals.editGoal') : t('goals.createGoal')} description={t('goals.formDescription')}><form className="form-stack" onSubmit={submit}><Field label={t('goals.titleLabel')}><input autoFocus {...register('title')} />{errors.title && <small className="field-error">{t('capture.errorTitle')}</small>}</Field><Field label={t('goals.descriptionLabel')}><textarea rows={3} {...register('description')} /></Field><div className="form-grid two"><Field label={t('goals.category')}><select {...register('category')}>{goalCategories.map((category) => <option key={category} value={category}>{label(category)}</option>)}</select></Field><Field label={t('goals.status')}><select {...register('status')}>{['Active', 'Paused', 'Completed', 'Archived'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></Field></div><div className="form-grid two"><Field label={t('goals.startDate')}><input type="date" {...register('startDate')} /></Field><Field label={t('goals.targetDate')}><input type="date" {...register('targetDate')} /></Field></div><Field label={t('goals.progressType')}><select {...register('progressType')}><option value="Manual">{label('Manual')}</option><option value="Metric">{label('Metric')}</option></select></Field>{progressType === 'Manual' ? <Field label={t('goals.progressPercent')}><input type="number" min="0" max="100" {...register('manualProgress', { valueAsNumber: true })} /></Field> : <><div className="form-grid three"><Field label={t('goals.start')}><input type="number" step="any" {...register('startValue', { setValueAs: numberOrNull })} /></Field><Field label={t('goals.current')}><input type="number" step="any" {...register('currentValue', { setValueAs: numberOrNull })} /></Field><Field label={t('goals.target')}><input type="number" step="any" {...register('targetValue', { setValueAs: numberOrNull })} /></Field></div><Field label={t('goals.unit')}><input {...register('unit')} placeholder={t('goals.unitPlaceholder')} /></Field></>}<div className="dialog-actions">{goal && <Button type="button" variant="danger" onClick={async () => { if (window.confirm(t('goals.deleteConfirm', { title: goal.title }))) { await deleteGoal(goal.id); onClose(); navigate('/goals') } }}><Trash2 size={15} /> {t('goals.delete')}</Button>}<span /><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('common.saving') : t('goals.save')}</Button></div></form></Modal>
}

function GoalDetail({ goalId }: { goalId: string }) {
  const { t, label, language } = useI18n()
  const navigate = useNavigate()
  const openCapture = useUIStore((state) => state.openCapture)
  const data = useLiveQuery(async () => {
    const [goal, projects, tasks, metrics, entries, achievements, notes] = await Promise.all([db.goals.get(goalId), db.projects.where('goalId').equals(goalId).toArray(), db.tasks.where('goalId').equals(goalId).toArray(), db.metricDefinitions.where('goalId').equals(goalId).toArray(), db.metricEntries.toArray(), db.achievements.where('goalId').equals(goalId).toArray(), db.goalNotes.where('goalId').equals(goalId).toArray()])
    return { goal, projects, tasks, metrics, entries: entries.filter((entry) => metrics.some((metric) => metric.id === entry.metricId)), achievements, notes }
  }, [goalId])
  const [editing, setEditing] = useState(false)
  if (!data) return <div className="page loading-page">{t('goals.loading')}</div>
  if (!data.goal) return <div className="page"><EmptyState title={t('goals.notFound')} description={t('goals.notFoundDescription')} action={<Button onClick={() => navigate('/goals')}>{t('goals.back')}</Button>} /></div>
  const goal = data.goal
  return <div className="page"><Link className="back-link" to="/goals"><ArrowLeft size={15} /> {t('goals.all')}</Link><PageHeader eyebrow={label(goal.category)} title={goal.title} description={goal.description} actions={<><Button variant="secondary" onClick={() => setEditing(true)}><Edit3 size={15} /> {t('common.edit')}</Button><Button onClick={() => openCapture('task', { goalId })}><Plus size={15} /> {t('goals.addTask')}</Button></>} /><div className="goal-overview"><Card><span>{t('goals.progress')}</span><strong>{Math.round(calculateGoalProgress(goal))}%</strong><ProgressBar value={calculateGoalProgress(goal)} /></Card><Card><span>{t('goals.timeline')}</span><strong>{goal.targetDate ? friendlyDate(goal.targetDate, language) : t('goals.openEnded')}</strong><small>{t('common.started')} {friendlyDate(goal.startDate, language)}</small></Card><Card><span>{t('goals.status')}</span><strong>{label(goal.status)}</strong><small>{label(goal.progressType)} · {t('goals.progress')}</small></Card>{goal.progressType === 'Metric' && <Card><span>{t('goals.currentMetric')}</span><strong>{goal.currentValue ?? '—'} {goal.unit}</strong><small>{t('common.target')} {goal.targetValue} {goal.unit}</small></Card>}</div>
    <div className="detail-grid"><div className="detail-main"><ProjectsSection goal={goal} projects={data.projects} /><TasksSection tasks={data.tasks} projects={data.projects} /><MetricsSection goal={goal} metrics={data.metrics} entries={data.entries} /><NotesSection goalId={goalId} notes={data.notes} /></div><aside><Card><SectionHeader title={t('achievements.title')} actions={<button className="text-button" onClick={() => openCapture('achievement', { goalId })}>{t('common.add')}</button>} />{data.achievements.length ? data.achievements.sort((a, b) => b.date.localeCompare(a.date)).map((item) => <div className="side-record" key={item.id}><span className="side-dot" /><div><strong>{item.title}</strong><small>{friendlyDate(item.date, language)}</small></div></div>) : <EmptyState title={t('goals.noAchievements')} description={t('goals.noAchievementsDescription')} />}</Card></aside></div><GoalEditor open={editing} goal={goal} onClose={() => setEditing(false)} /></div>
}

function ProjectsSection({ goal, projects }: { goal: Goal; projects: Project[] }) {
  const { t, label, language } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  async function add(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; await saveProject({ goalId: goal.id, title: title.trim(), description: '', status: 'Active', startDate: todayKey(), targetDate: goal.targetDate, demoSetId: null }); setTitle(''); setShowForm(false) }
  return <Card><SectionHeader title={t('goals.projects')} meta={`${projects.length}`} actions={<button className="text-button" onClick={() => setShowForm(!showForm)}><Plus size={14} /> {t('goals.addProject')}</button>} />{showForm && <form className="inline-form" onSubmit={add}><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('goals.projectTitle')} /><Button type="submit">{t('common.add')}</Button></form>}{projects.length ? <div className="record-list">{projects.map((project) => <div key={project.id}><span className="record-icon"><Target size={16} /></span><div><strong>{project.title}</strong><small>{label(project.status)}{project.targetDate ? ` · ${friendlyDate(project.targetDate, language)}` : ''}</small></div><button className="icon-button" aria-label={t('goals.deleteProject', { title: project.title })} onClick={() => void deleteProject(project.id)}><Trash2 size={15} /></button></div>)}</div> : <EmptyState title={t('goals.noProjects')} description={t('goals.noProjectsDescription')} />}</Card>
}

function TasksSection({ tasks, projects }: { tasks: LifeTask[]; projects: Project[] }) {
  const { t, label, language } = useI18n()
  const openCapture = useUIStore((state) => state.openCapture)
  const projectById = new Map(projects.map((project) => [project.id, project]))
  return <Card><SectionHeader title={t('goals.tasks')} meta={`${tasks.length}`} />{tasks.length ? <div className="record-list">{tasks.sort((a, b) => (a.scheduledDate ?? '9999').localeCompare(b.scheduledDate ?? '9999')).map((task) => <div key={task.id}><button className={`task-check ${task.status === 'Done' ? 'checked' : ''}`} onClick={() => void setTaskStatus(task, task.status === 'Done' ? 'Todo' : 'Done')} aria-label={t('goals.toggleTask', { title: task.title })} /> <button className="record-button" onClick={() => openCapture('task', { recordId: task.id })}><strong>{task.title}</strong><small>{task.projectId ? projectById.get(task.projectId)?.title : t('goals.noProject')}{task.scheduledDate ? ` · ${friendlyDate(task.scheduledDate, language)}` : ''}</small></button><select value={task.status} onChange={(event) => void setTaskStatus(task, event.target.value as TaskStatus)}>{['Todo', 'In Progress', 'Done', 'Skipped'].map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></div>)}</div> : <EmptyState title={t('goals.noTasks')} description={t('goals.noTasksDescription')} />}</Card>
}

function MetricsSection({ goal, metrics, entries }: { goal: Goal; metrics: MetricDefinition[]; entries: MetricEntry[] }) {
  const { t, language } = useI18n()
  const [metricId, setMetricId] = useState(metrics[0]?.id ?? '')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayKey())
  const [newName, setNewName] = useState('')
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => { if (!metricId && metrics[0]) setMetricId(metrics[0].id) }, [metrics, metricId])
  async function addEntry(event: FormEvent) { event.preventDefault(); if (!metricId || value === '') return; await saveMetricEntry({ metricId, value: Number(value), date, note: '', demoSetId: null }); setValue('') }
  async function addMetric(event: FormEvent) { event.preventDefault(); if (!newName.trim()) return; const created = await saveMetricDefinition({ name: newName.trim(), category: goal.category, unit: goal.unit ?? '', goalId: goal.id, demoSetId: null }); setMetricId(created.id); setNewName('') }
  async function removeEntry(entry: MetricEntry, unit: string) { const displayDate = friendlyDate(entry.date, language); if (!window.confirm(t('goals.deleteMetricConfirm', { date: displayDate, value: `${entry.value} ${unit}` }))) return; await deleteMetricEntry(entry.id); setAnnouncement(t('goals.metricDeleted')); window.setTimeout(() => setAnnouncement(''), 1800) }
  return <Card><SectionHeader title={t('goals.metrics')} meta={t('common.entries', { count: entries.length })} />{metrics.length ? <form className="inline-form metric-entry" onSubmit={addEntry}><select value={metricId} onChange={(event) => setMetricId(event.target.value)}>{metrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.name} ({metric.unit})</option>)}</select><input type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder={t('goals.value')} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><Button type="submit">{t('goals.record')}</Button></form> : <form className="inline-form" onSubmit={addMetric}><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={t('goals.metricName')} /><Button type="submit">{t('goals.createMetric')}</Button></form>}<span className="sr-only" aria-live="polite">{announcement}</span>{entries.length ? <div className="metric-history">{entries.sort((a, b) => b.date.localeCompare(a.date)).map((entry) => { const metric = metrics.find((item) => item.id === entry.metricId); const unit = metric?.unit ?? ''; return <div key={entry.id}><span>{friendlyDate(entry.date, language)}</span><strong>{entry.value} {unit}</strong><button type="button" className="icon-button metric-delete" aria-label={`${t('goals.deleteMetricEntry')} · ${friendlyDate(entry.date, language)} · ${entry.value} ${unit}`} onClick={() => void removeEntry(entry, unit)}><Trash2 size={15} /></button></div> })}</div> : <p className="muted-copy">{t('goals.noMetricEntries')}</p>}</Card>
}

function NotesSection({ goalId, notes }: { goalId: string; notes: GoalNote[] }) {
  const { t } = useI18n()
  const [content, setContent] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); if (!content.trim()) return; await saveGoalNote({ goalId, content: content.trim(), demoSetId: null }); setContent('') }
  return <Card><SectionHeader title={t('goals.notes')} meta={`${notes.length}`} /><form className="inline-form" onSubmit={submit}><input value={content} onChange={(event) => setContent(event.target.value)} placeholder={t('goals.notePlaceholder')} /><Button type="submit">{t('common.add')}</Button></form>{notes.map((note) => <p className="note-item" key={note.id}>{note.content}</p>)}</Card>
}

function defaults(goal: Goal | null): GoalForm {
  return { title: goal?.title ?? '', description: goal?.description ?? '', category: goal?.category ?? 'Other', status: goal?.status ?? 'Active', startDate: goal?.startDate ?? todayKey(), targetDate: goal?.targetDate ?? '', progressType: goal?.progressType ?? 'Manual', manualProgress: goal?.manualProgress ?? 0, startValue: goal?.startValue ?? null, targetValue: goal?.targetValue ?? null, currentValue: goal?.currentValue ?? null, unit: goal?.unit ?? '' }
}

function numberOrNull(value: unknown) { return value === '' || value == null ? null : Number(value) }
