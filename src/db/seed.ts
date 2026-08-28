import { addDays, subDays } from 'date-fns'
import { dateKey, todayKey } from '../lib/date'
import type { Achievement, Goal, LifeTask, MetricDefinition, MetricEntry, Milestone, Project } from '../types'
import { db, timestamp } from './database'

export const DEMO_SET_ID = 'life-os-demo-v1'
const DEMO_SETTING = 'demoDataState'

export async function ensureDemoData() {
  const state = await db.appSettings.get(DEMO_SETTING)
  if (state) return
  await seedDemoData()
}

export async function seedDemoData() {
  const now = timestamp()
  const today = todayKey()
  const shared = { createdAt: now, updatedAt: now, demoSetId: DEMO_SET_ID }
  const weightMetricId = 'demo-metric-weight'

  const goals: Goal[] = [
    { ...shared, id: 'demo-goal-health', title: 'Weight Loss', description: 'Build a sustainable health routine and reach a healthier weight.', category: 'Health', status: 'Active', startDate: dateKey(subDays(new Date(), 60)), targetDate: dateKey(addDays(new Date(), 180)), progressType: 'Metric', startValue: 103, targetValue: 75, currentValue: 99.8, unit: 'kg', manualProgress: 0, primaryMetricId: weightMetricId },
    { ...shared, id: 'demo-goal-english', title: 'Academic Working English', description: 'Handle presentations, oral defenses and basic research communication.', category: 'English', status: 'Active', startDate: dateKey(subDays(new Date(), 30)), targetDate: dateKey(addDays(new Date(), 150)), progressType: 'Manual', startValue: null, targetValue: null, currentValue: null, unit: null, manualProgress: 15, primaryMetricId: null },
    { ...shared, id: 'demo-goal-research', title: 'Join Embodied AI Research', description: 'Join a project related to VLA, world models or robot learning.', category: 'Research', status: 'Active', startDate: dateKey(subDays(new Date(), 14)), targetDate: dateKey(addDays(new Date(), 240)), progressType: 'Manual', startValue: null, targetValue: null, currentValue: null, unit: null, manualProgress: 10, primaryMetricId: null },
  ]
  const projects: Project[] = [
    { ...shared, id: 'demo-project-oral', goalId: 'demo-goal-english', title: 'Oral Defense Preparation', description: 'Build confident academic speaking habits.', status: 'Active', startDate: today, targetDate: dateKey(addDays(new Date(), 45)) },
    { ...shared, id: 'demo-project-lab', goalId: 'demo-goal-research', title: 'Professor Outreach', description: 'Prepare and contact relevant research groups.', status: 'Active', startDate: today, targetDate: dateKey(addDays(new Date(), 60)) },
  ]
  const tasks: LifeTask[] = [
    { ...shared, id: 'demo-task-speaking', title: 'Practice speaking for 30 minutes', description: 'Explain the current project without reading notes.', goalId: 'demo-goal-english', projectId: 'demo-project-oral', status: 'Todo', priority: 'High', estimatedMinutes: 30, actualMinutes: null, scheduledDate: today, deadline: null, completedAt: null, repeatType: 'Daily' },
    { ...shared, id: 'demo-task-swim', title: 'Swimming session', description: 'Easy aerobic session.', goalId: 'demo-goal-health', projectId: null, status: 'Todo', priority: 'Medium', estimatedMinutes: 45, actualMinutes: null, scheduledDate: today, deadline: null, completedAt: null, repeatType: 'Weekly' },
    { ...shared, id: 'demo-task-email', title: 'Draft professor introduction email', description: 'Keep the email concise and specific.', goalId: 'demo-goal-research', projectId: 'demo-project-lab', status: 'In Progress', priority: 'High', estimatedMinutes: 40, actualMinutes: null, scheduledDate: dateKey(addDays(new Date(), 1)), deadline: dateKey(addDays(new Date(), 1)), completedAt: null, repeatType: 'None' },
    { ...shared, id: 'demo-task-assignment', title: 'Robotics assignment 1', description: 'Submit report and code.', goalId: 'demo-goal-research', projectId: null, status: 'Todo', priority: 'High', estimatedMinutes: 120, actualMinutes: null, scheduledDate: dateKey(addDays(new Date(), 3)), deadline: dateKey(addDays(new Date(), 5)), completedAt: null, repeatType: 'None' },
  ]
  const definitions: MetricDefinition[] = [
    { ...shared, id: weightMetricId, name: 'Weight', category: 'Health', unit: 'kg', goalId: 'demo-goal-health' },
  ]
  const entries: MetricEntry[] = [
    { ...shared, id: 'demo-weight-1', metricId: weightMetricId, value: 103, date: dateKey(subDays(new Date(), 56)), note: 'Starting point' },
    { ...shared, id: 'demo-weight-2', metricId: weightMetricId, value: 101.6, date: dateKey(subDays(new Date(), 28)), note: '' },
    { ...shared, id: 'demo-weight-3', metricId: weightMetricId, value: 100.4, date: dateKey(subDays(new Date(), 7)), note: '' },
    { ...shared, id: 'demo-weight-4', metricId: weightMetricId, value: 99.8, date: today, note: 'Below 100 kg' },
  ]
  const achievements: Achievement[] = [
    { ...shared, id: 'demo-achievement-email', title: 'First email sent to a professor', description: 'Made the first concrete step toward joining a research group.', date: dateKey(subDays(new Date(), 3)), goalId: 'demo-goal-research', category: 'Research' },
    { ...shared, id: 'demo-achievement-weight', title: 'Weight dropped below 100 kg', description: 'Reached the first important health milestone.', date: today, goalId: 'demo-goal-health', category: 'Health' },
  ]
  const milestones: Milestone[] = [
    { ...shared, id: 'demo-milestone-meeting', title: 'First professor meeting', description: 'Discuss research fit and possible project work.', goalId: 'demo-goal-research', category: 'Research', date: dateKey(addDays(new Date(), 12)) },
  ]

  await db.transaction('rw', [db.goals, db.projects, db.tasks, db.metricDefinitions, db.metricEntries, db.achievements, db.milestones, db.appSettings], async () => {
    await db.goals.bulkPut(goals)
    await db.projects.bulkPut(projects)
    await db.tasks.bulkPut(tasks)
    await db.metricDefinitions.bulkPut(definitions)
    await db.metricEntries.bulkPut(entries)
    await db.achievements.bulkPut(achievements)
    await db.milestones.bulkPut(milestones)
    await db.appSettings.put({ key: DEMO_SETTING, value: 'seeded', updatedAt: now })
  })
}

export async function removeDemoData() {
  const tables = [db.goals, db.projects, db.tasks, db.milestones, db.metricDefinitions, db.metricEntries, db.achievements, db.goalNotes, db.dailyJournals, db.thoughts, db.weeklyReviews]
  await db.transaction('rw', [...tables, db.appSettings], async () => {
    for (const table of tables) await table.where('demoSetId').equals(DEMO_SET_ID).delete()
    await db.appSettings.put({ key: DEMO_SETTING, value: 'removed', updatedAt: timestamp() })
  })
}

export async function restoreDemoData() {
  await removeDemoData()
  await db.appSettings.delete(DEMO_SETTING)
  await seedDemoData()
}
