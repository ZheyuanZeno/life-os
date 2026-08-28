import Dexie, { type EntityTable } from 'dexie'
import type {
  Achievement,
  AppSetting,
  DailyJournal,
  Goal,
  GoalNote,
  LifeTask,
  MetricDefinition,
  MetricEntry,
  Milestone,
  Project,
  Thought,
  WeeklyReview,
} from '../types'

export class LifeOSDatabase extends Dexie {
  goals!: EntityTable<Goal, 'id'>
  projects!: EntityTable<Project, 'id'>
  tasks!: EntityTable<LifeTask, 'id'>
  milestones!: EntityTable<Milestone, 'id'>
  metricDefinitions!: EntityTable<MetricDefinition, 'id'>
  metricEntries!: EntityTable<MetricEntry, 'id'>
  achievements!: EntityTable<Achievement, 'id'>
  goalNotes!: EntityTable<GoalNote, 'id'>
  dailyJournals!: EntityTable<DailyJournal, 'id'>
  thoughts!: EntityTable<Thought, 'id'>
  weeklyReviews!: EntityTable<WeeklyReview, 'id'>
  appSettings!: EntityTable<AppSetting, 'key'>

  constructor(name = 'life-os-v1') {
    super(name)
    this.version(1).stores({
      goals: 'id, status, category, targetDate, updatedAt, demoSetId',
      projects: 'id, goalId, status, targetDate, updatedAt, demoSetId',
      tasks: 'id, goalId, projectId, status, scheduledDate, deadline, completedAt, priority, updatedAt, demoSetId',
      milestones: 'id, goalId, date, category, updatedAt, demoSetId',
      metricDefinitions: 'id, goalId, category, name, updatedAt, demoSetId',
      metricEntries: 'id, metricId, date, [metricId+date], updatedAt, demoSetId',
      achievements: 'id, goalId, category, date, createdAt, demoSetId',
      goalNotes: 'id, goalId, updatedAt, demoSetId',
      dailyJournals: 'id, &date, updatedAt, demoSetId',
      thoughts: 'id, createdAt, updatedAt, demoSetId, *tags',
      weeklyReviews: 'id, &weekKey, updatedAt, demoSetId',
      appSettings: 'key, updatedAt',
    })
    this.version(2).stores({
      goals: 'id, status, category, targetDate, updatedAt, demoSetId',
      projects: 'id, goalId, status, targetDate, updatedAt, demoSetId',
      tasks: 'id, goalId, projectId, status, scheduledDate, deadline, completedAt, priority, updatedAt, demoSetId',
      milestones: 'id, goalId, date, category, updatedAt, demoSetId',
      metricDefinitions: 'id, goalId, category, name, updatedAt, demoSetId',
      metricEntries: 'id, metricId, date, [metricId+date], updatedAt, demoSetId',
      achievements: 'id, goalId, category, date, createdAt, demoSetId',
      goalNotes: 'id, goalId, updatedAt, demoSetId',
      dailyJournals: 'id, date, createdAt, updatedAt, demoSetId',
      thoughts: 'id, createdAt, updatedAt, demoSetId, *tags',
      weeklyReviews: 'id, &weekKey, updatedAt, demoSetId',
      appSettings: 'key, updatedAt',
    }).upgrade(async (transaction) => {
      await transaction.table('dailyJournals').toCollection().modify((record) => { if (!Array.isArray(record.editHistory)) record.editHistory = record.updatedAt !== record.createdAt ? [record.updatedAt] : [] })
      await transaction.table('thoughts').toCollection().modify((record) => { if (!Array.isArray(record.editHistory)) record.editHistory = record.updatedAt !== record.createdAt ? [record.updatedAt] : [] })
    })
  }
}

export const db = new LifeOSDatabase()
export const newId = () => crypto.randomUUID()
export const timestamp = () => new Date().toISOString()
