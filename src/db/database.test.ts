import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { LifeOSDatabase } from './database'

describe('database version 2 migration', () => {
  let databaseName = ''

  afterEach(async () => {
    if (databaseName) await Dexie.delete(databaseName)
  })

  it('preserves legacy records, initializes edit history and removes the one-journal-per-day constraint', async () => {
    databaseName = `life-os-v2-migration-${crypto.randomUUID()}`
    const legacy = new Dexie(databaseName)
    legacy.version(1).stores({ dailyJournals: 'id, &date, updatedAt, demoSetId', thoughts: 'id, createdAt, updatedAt, demoSetId, *tags' })
    await legacy.open()
    const createdAt = '2026-08-27T08:00:00.000Z'
    await legacy.table('dailyJournals').add({ id: 'journal-legacy', date: '2026-08-27', content: 'Legacy journal', mood: 3, energy: 3, createdAt, updatedAt: '2026-08-27T09:00:00.000Z', demoSetId: null })
    await legacy.table('thoughts').add({ id: 'thought-legacy', title: 'Legacy thought', content: '', tags: [], createdAt, updatedAt: createdAt, demoSetId: null })
    legacy.close()

    const upgraded = new LifeOSDatabase(databaseName)
    await upgraded.open()
    expect((await upgraded.dailyJournals.get('journal-legacy'))?.editHistory).toEqual(['2026-08-27T09:00:00.000Z'])
    expect((await upgraded.thoughts.get('thought-legacy'))?.editHistory).toEqual([])
    await upgraded.dailyJournals.add({ id: 'journal-same-day', date: '2026-08-27', content: 'Another entry', mood: 4, energy: 4, createdAt, updatedAt: createdAt, editHistory: [], demoSetId: null })
    expect(await upgraded.dailyJournals.where('date').equals('2026-08-27').count()).toBe(2)
    upgraded.close()
  })
})
