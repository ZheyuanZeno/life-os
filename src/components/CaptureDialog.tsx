import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { db } from '../db/database'
import { saveAchievement, saveMilestone, saveTask, saveThought } from '../db/repositories'
import { useI18n } from '../i18n'
import { todayKey } from '../lib/date'
import { useUIStore, type CaptureType } from '../store/ui'
import { goalCategories, type GoalCategory, type LifeTask, type Milestone, type TaskPriority } from '../types'
import { Button, Field, Modal } from './ui'

const titleSchema = z.string().trim().min(1).max(160)

export function CaptureDialog() {
  const { captureOpen, captureType, captureDefaults, closeCapture, openCapture } = useUIStore()
  const { t, label } = useI18n()
  const goals = useLiveQuery(() => db.goals.where('status').equals('Active').sortBy('title'), []) ?? []
  const projects = useLiveQuery(() => db.projects.where('status').equals('Active').sortBy('title'), []) ?? []
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalId, setGoalId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [minutes, setMinutes] = useState('')
  const [scheduledDate, setScheduledDate] = useState(todayKey())
  const [deadline, setDeadline] = useState('')
  const [date, setDate] = useState(todayKey())
  const [category, setCategory] = useState<GoalCategory>('Other')
  const [tags, setTags] = useState('')
  const [editingTask, setEditingTask] = useState<LifeTask | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const typeKey = `capture.${captureType}` as const
  const typeLabel = t(typeKey)

  useEffect(() => {
    if (!captureOpen) return
    setTitle(''); setDescription(''); setGoalId(captureDefaults.goalId ?? ''); setProjectId(captureDefaults.projectId ?? '')
    setPriority('Medium'); setMinutes(''); setScheduledDate(captureDefaults.scheduledDate ?? todayKey()); setDeadline('')
    setDate(captureDefaults.date ?? todayKey()); setCategory('Other'); setTags(''); setEditingTask(null); setEditingMilestone(null); setError('')
    if (captureType === 'task' && captureDefaults.recordId) void db.tasks.get(captureDefaults.recordId).then((task) => {
      if (!task) return
      setEditingTask(task); setTitle(task.title); setDescription(task.description); setGoalId(task.goalId ?? '')
      setProjectId(task.projectId ?? ''); setPriority(task.priority); setMinutes(task.estimatedMinutes?.toString() ?? '')
      setScheduledDate(task.scheduledDate ?? ''); setDeadline(task.deadline ?? '')
    })
    if (captureType === 'milestone' && captureDefaults.recordId) void db.milestones.get(captureDefaults.recordId).then((milestone) => {
      if (!milestone) return
      setEditingMilestone(milestone); setTitle(milestone.title); setDescription(milestone.description); setGoalId(milestone.goalId ?? '')
      setCategory(milestone.category); setDate(milestone.date)
    })
  }, [captureOpen, captureType, captureDefaults])

  useEffect(() => {
    if (!goalId) return
    const goal = goals.find((item) => item.id === goalId)
    if (goal) setCategory(goal.category)
  }, [goalId, goals])

  const availableProjects = useMemo(() => projects.filter((project) => project.goalId === goalId), [projects, goalId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = titleSchema.safeParse(title)
    if (!parsed.success) {
      setError(title.trim().length ? t('capture.errorLongTitle') : t('capture.errorTitle'))
      return
    }
    setSaving(true); setError('')
    try {
      if (captureType === 'task') {
        await saveTask({ ...(editingTask ?? {}), id: editingTask?.id, title: parsed.data, description: description.trim(), goalId: goalId || null, projectId: projectId || null, status: editingTask?.status ?? 'Todo', priority, estimatedMinutes: minutes ? Number(minutes) : null, actualMinutes: editingTask?.actualMinutes ?? null, scheduledDate: scheduledDate || null, deadline: deadline || null, completedAt: editingTask?.completedAt ?? null, repeatType: editingTask?.repeatType ?? 'None', demoSetId: editingTask?.demoSetId ?? null })
      } else if (captureType === 'thought') {
        await saveThought({ title: parsed.data, content: description.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), demoSetId: null })
      } else if (captureType === 'achievement') {
        await saveAchievement({ title: parsed.data, description: description.trim(), date, goalId: goalId || null, category, demoSetId: null })
      } else {
        await saveMilestone({ ...(editingMilestone ?? {}), id: editingMilestone?.id, title: parsed.data, description: description.trim(), date, goalId: goalId || null, category, demoSetId: editingMilestone?.demoSetId ?? null })
      }
      closeCapture()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('capture.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const editing = editingTask || editingMilestone
  const dialogTitle = editing ? t('capture.edit', { type: typeLabel.toLowerCase() }) : t('capture.quick', { type: typeLabel })
  return <Modal open={captureOpen} onOpenChange={(open) => !open && closeCapture()} title={dialogTitle} description={t('capture.description')}>
    {!editing && <div className="capture-tabs" role="tablist">{(['task', 'thought', 'achievement', 'milestone'] as CaptureType[]).map((type) => <button key={type} type="button" role="tab" aria-selected={captureType === type} onClick={() => openCapture(type, captureDefaults)}>{t(`capture.${type}` as const)}</button>)}</div>}
    <form onSubmit={submit} className="form-stack">
      <Field label={t('capture.title')}><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={captureType === 'task' ? t('capture.titleTaskPlaceholder') : t('capture.titlePlaceholder', { type: typeLabel.toLowerCase() })} /></Field>
      <Field label={captureType === 'thought' ? t('capture.thoughtLabel') : t('capture.descriptionLabel')}><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('capture.contextPlaceholder')} /></Field>
      {captureType === 'thought' ? <Field label={t('capture.tags')} hint={t('capture.tagsHint')}><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t('capture.tagsPlaceholder')} /></Field> : <div className="form-grid two">
        <Field label={t('capture.goal')}><select value={goalId} onChange={(event) => { setGoalId(event.target.value); setProjectId('') }}><option value="">{t('common.noGoal')}</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></Field>
        {captureType === 'task' ? <Field label={t('capture.project')}><select value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={!goalId}><option value="">{t('common.noProject')}</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></Field> : <Field label={t('capture.category')}><select value={category} onChange={(event) => setCategory(event.target.value as GoalCategory)}>{goalCategories.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></Field>}
      </div>}
      {captureType === 'task' && <><div className="form-grid three"><Field label={t('capture.priority')}><select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>{(['Low', 'Medium', 'High'] as TaskPriority[]).map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></Field><Field label={t('capture.estimate')}><input type="number" min="0" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></Field><Field label={t('capture.scheduled')}><input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></Field></div><Field label={t('capture.deadline')}><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field></>}
      {(captureType === 'achievement' || captureType === 'milestone') && <Field label={t('capture.date')}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        {editingTask && <Button type="button" variant="danger" onClick={async () => { await db.tasks.delete(editingTask.id); closeCapture() }}>{t('capture.deleteTask')}</Button>}
        {editingMilestone && <Button type="button" variant="danger" onClick={async () => { await db.milestones.delete(editingMilestone.id); closeCapture() }}>{t('capture.deleteMilestone')}</Button>}
        <span /><Button type="button" variant="secondary" onClick={closeCapture}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={saving}>{saving ? t('common.saving') : editing ? t('capture.saveChanges') : t('capture.save', { type: typeLabel.toLowerCase() })}</Button>
      </div>
    </form>
  </Modal>
}
