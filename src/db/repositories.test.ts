import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LifeOSDatabase } from './database'
import { deleteMetricEntry, saveJournal, saveThought, updateJournal, updateThought } from './repositories'
import type { Goal, MetricDefinition, MetricEntry } from '../types'

const audit = { createdAt: '2026-08-01T08:00:00.000Z', updatedAt: '2026-08-01T08:00:00.000Z', demoSetId: null }

describe('deleteMetricEntry', () => {
  let database: LifeOSDatabase

  beforeEach(async () => {
    database = new LifeOSDatabase(`life-os-metric-delete-${crypto.randomUUID()}`)
    await database.open()
  })

  afterEach(async () => {
    await database.delete()
  })

  it('deletes only the selected entry and recalculates the primary metric current value', async () => {
    const goal: Goal = { ...audit, id: 'goal-health', title: 'Weight Loss', description: '', category: 'Health', status: 'Active', startDate: '2026-08-01', targetDate: null, progressType: 'Metric', startValue: 105, targetValue: 75, currentValue: 90, unit: 'kg', manualProgress: 0, primaryMetricId: 'metric-weight' }
    const definition: MetricDefinition = { ...audit, id: 'metric-weight', name: 'Weight', category: 'Health', unit: 'kg', goalId: goal.id }
    const entries: MetricEntry[] = [
      { ...audit, id: 'entry-older', metricId: definition.id, value: 100, date: '2026-08-10', note: '' },
      { ...audit, id: 'entry-newer', metricId: definition.id, value: 90, date: '2026-08-20', note: '' },
    ]
    await database.goals.add(goal)
    await database.metricDefinitions.add(definition)
    await database.metricEntries.bulkAdd(entries)

    await deleteMetricEntry('entry-newer', database)

    expect(await database.metricEntries.get('entry-newer')).toBeUndefined()
    expect(await database.metricEntries.get('entry-older')).toBeDefined()
    expect((await database.goals.get(goal.id))?.currentValue).toBe(100)

    await deleteMetricEntry('entry-older', database)
    expect((await database.goals.get(goal.id))?.currentValue).toBe(105)
  })

  it('leaves the database unchanged when the entry no longer exists', async () => {
    await expect(deleteMetricEntry('missing-entry', database)).resolves.toBeUndefined()
    expect(await database.metricEntries.count()).toBe(0)
  })
})

describe('editable journal and thought records', () => {
  let database: LifeOSDatabase

  beforeEach(async () => {
    database = new LifeOSDatabase(`life-os-record-edit-${crypto.randomUUID()}`)
    await database.open()
  })

  afterEach(async () => {
    await database.delete()
  })

  it('keeps separate same-day journals and appends every edit timestamp', async () => {
    const first = await saveJournal({ date: '2026-08-28', content: 'First entry', mood: 3, energy: 4, demoSetId: null }, database)
    const second = await saveJournal({ date: '2026-08-28', content: 'Second entry', mood: 4, energy: 3, demoSetId: null }, database)
    await updateJournal(first.id, { date: first.date, content: 'First entry edited', mood: 4, energy: 4, demoSetId: null }, database)
    await updateJournal(first.id, { date: first.date, content: 'First entry edited again', mood: 5, energy: 4, demoSetId: null }, database)

    expect(await database.dailyJournals.where('date').equals('2026-08-28').count()).toBe(2)
    expect((await database.dailyJournals.get(first.id))?.editHistory).toHaveLength(2)
    expect(await database.dailyJournals.get(second.id)).toBeDefined()
  })

  it('updates a thought while preserving creation time and edit timestamps', async () => {
    const thought = await saveThought({ title: 'Rough idea', content: 'Draft', tags: ['research'], demoSetId: null }, database)
    const updated = await updateThought(thought.id, { title: 'Clear idea', content: 'Revised', tags: ['research', 'next'], demoSetId: null }, database)

    expect(updated.createdAt).toBe(thought.createdAt)
    expect(updated.editHistory).toHaveLength(1)
    expect((await database.thoughts.get(thought.id))?.title).toBe('Clear idea')
  })
})
