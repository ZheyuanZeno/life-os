import { db, newId, timestamp, type LifeOSDatabase } from './database'
import type {
  Achievement,
  DailyJournal,
  Goal,
  GoalNote,
  LifeTask,
  MetricDefinition,
  MetricEntry,
  Milestone,
  Project,
  TaskStatus,
  Thought,
  WeeklyReview,
} from '../types'

type NewRecord<T extends { id: string; createdAt: string; updatedAt: string }> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

function audit<T extends { id?: string; createdAt?: string }>(input: T) {
  const now = timestamp()
  return { id: input.id ?? newId(), createdAt: input.createdAt ?? now, updatedAt: now }
}

export async function saveGoal(input: NewRecord<Goal> | Goal) {
  const record = { ...input, ...audit(input) } as Goal
  await db.goals.put(record)
  return record
}

export async function deleteGoal(id: string) {
  await db.transaction('rw', [db.goals, db.projects, db.tasks, db.metricDefinitions, db.metricEntries, db.goalNotes, db.achievements, db.milestones], async () => {
    const metricIds = await db.metricDefinitions.where('goalId').equals(id).primaryKeys()
    await db.projects.where('goalId').equals(id).delete()
    await db.tasks.where('goalId').equals(id).delete()
    for (const metricId of metricIds) await db.metricEntries.where('metricId').equals(metricId).delete()
    await db.metricDefinitions.where('goalId').equals(id).delete()
    await db.goalNotes.where('goalId').equals(id).delete()
    await db.achievements.where('goalId').equals(id).modify({ goalId: null, updatedAt: timestamp() })
    await db.milestones.where('goalId').equals(id).modify({ goalId: null, updatedAt: timestamp() })
    await db.goals.delete(id)
  })
}

export async function saveProject(input: NewRecord<Project> | Project) {
  const record = { ...input, ...audit(input) } as Project
  await db.projects.put(record)
  return record
}

export async function deleteProject(id: string) {
  await db.transaction('rw', [db.projects, db.tasks], async () => {
    await db.tasks.where('projectId').equals(id).modify({ projectId: null, updatedAt: timestamp() })
    await db.projects.delete(id)
  })
}

export async function saveTask(input: NewRecord<LifeTask> | LifeTask) {
  if (input.projectId) {
    const project = await db.projects.get(input.projectId)
    if (!project || project.goalId !== input.goalId) throw new Error('The selected project does not belong to this goal.')
  }
  const record = { ...input, ...audit(input) } as LifeTask
  await db.tasks.put(record)
  return record
}

export async function setTaskStatus(task: LifeTask, status: TaskStatus) {
  await db.tasks.update(task.id, {
    status,
    completedAt: status === 'Done' ? task.completedAt ?? timestamp() : null,
    actualMinutes: status === 'Done' ? task.actualMinutes ?? task.estimatedMinutes : task.actualMinutes,
    updatedAt: timestamp(),
  })
}

export async function saveMetricDefinition(input: NewRecord<MetricDefinition> | MetricDefinition) {
  const record = { ...input, ...audit(input) } as MetricDefinition
  await db.metricDefinitions.put(record)
  return record
}

export async function saveMetricEntry(input: NewRecord<MetricEntry> | MetricEntry) {
  const record = { ...input, ...audit(input) } as MetricEntry
  await db.transaction('rw', [db.metricEntries, db.metricDefinitions, db.goals], async () => {
    await db.metricEntries.put(record)
    const definition = await db.metricDefinitions.get(record.metricId)
    if (definition?.goalId) {
      const goal = await db.goals.get(definition.goalId)
      if (goal?.primaryMetricId === definition.id) await db.goals.update(goal.id, { currentValue: record.value, updatedAt: record.updatedAt })
    }
  })
  return record
}

export async function deleteMetricEntry(id: string, database: LifeOSDatabase = db) {
  await database.transaction('rw', [database.metricEntries, database.metricDefinitions, database.goals], async () => {
    const entry = await database.metricEntries.get(id)
    if (!entry) return
    const definition = await database.metricDefinitions.get(entry.metricId)
    await database.metricEntries.delete(id)
    if (!definition?.goalId) return
    const goal = await database.goals.get(definition.goalId)
    if (!goal || goal.primaryMetricId !== definition.id) return
    const remaining = await database.metricEntries.where('metricId').equals(entry.metricId).toArray()
    const latest = remaining.sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))[0]
    await database.goals.update(goal.id, { currentValue: latest?.value ?? goal.startValue ?? null, updatedAt: timestamp() })
  })
}

export async function saveAchievement(input: NewRecord<Achievement> | Achievement) {
  const record = { ...input, ...audit(input) } as Achievement
  await db.achievements.put(record)
  return record
}

export async function saveMilestone(input: NewRecord<Milestone> | Milestone) {
  const record = { ...input, ...audit(input) } as Milestone
  await db.milestones.put(record)
  return record
}

export async function saveGoalNote(input: NewRecord<GoalNote> | GoalNote) {
  const record = { ...input, ...audit(input) } as GoalNote
  await db.goalNotes.put(record)
  return record
}

type JournalDraft = Omit<DailyJournal, 'id' | 'createdAt' | 'updatedAt' | 'editHistory'>
type ThoughtDraft = Omit<Thought, 'id' | 'createdAt' | 'updatedAt' | 'editHistory'>

export async function saveJournal(input: JournalDraft, database: LifeOSDatabase = db) {
  const now = timestamp()
  const record: DailyJournal = { ...input, id: newId(), createdAt: now, updatedAt: now, editHistory: [] }
  await database.dailyJournals.add(record)
  return record
}

export async function updateJournal(id: string, input: JournalDraft, database: LifeOSDatabase = db) {
  const existing = await database.dailyJournals.get(id)
  if (!existing) throw new Error('Journal entry not found.')
  const now = timestamp()
  const record: DailyJournal = { ...existing, ...input, updatedAt: now, editHistory: [...existing.editHistory, now] }
  await database.dailyJournals.put(record)
  return record
}

export async function saveThought(input: ThoughtDraft, database: LifeOSDatabase = db) {
  const now = timestamp()
  const record: Thought = { ...input, id: newId(), createdAt: now, updatedAt: now, editHistory: [] }
  await database.thoughts.add(record)
  return record
}

export async function updateThought(id: string, input: ThoughtDraft, database: LifeOSDatabase = db) {
  const existing = await database.thoughts.get(id)
  if (!existing) throw new Error('Thought not found.')
  const now = timestamp()
  const record: Thought = { ...existing, ...input, updatedAt: now, editHistory: [...existing.editHistory, now] }
  await database.thoughts.put(record)
  return record
}

export async function saveWeeklyReview(input: Omit<WeeklyReview, 'id' | 'createdAt' | 'updatedAt'>) {
  const existing = await db.weeklyReviews.where('weekKey').equals(input.weekKey).first()
  const now = timestamp()
  const record: WeeklyReview = { ...input, id: existing?.id ?? newId(), createdAt: existing?.createdAt ?? now, updatedAt: now }
  await db.weeklyReviews.put(record)
  return record
}
