import { describe, expect, it } from 'vitest'
import { calculateGoalProgress, calculateWeeklyStats } from './calculations'
import type { Goal, LifeTask } from '../types'

const audit = { createdAt: '2026-08-24T08:00:00.000Z', updatedAt: '2026-08-24T08:00:00.000Z' }

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    ...audit,
    id: 'goal-1',
    title: 'Weight Loss',
    description: '',
    category: 'Health',
    status: 'Active',
    startDate: '2026-08-01',
    targetDate: '2027-01-01',
    progressType: 'Metric',
    startValue: 103,
    targetValue: 75,
    currentValue: 96,
    unit: 'kg',
    manualProgress: 0,
    primaryMetricId: null,
    ...overrides,
  }
}

describe('calculateGoalProgress', () => {
  it('handles descending metric goals', () => {
    expect(calculateGoalProgress(goal())).toBe(25)
  })

  it('clamps manual progress', () => {
    expect(calculateGoalProgress(goal({ progressType: 'Manual', manualProgress: 130 }))).toBe(100)
  })
})

describe('calculateWeeklyStats', () => {
  it('uses actual minutes and the associated goal category', () => {
    const task: LifeTask = {
      ...audit,
      id: 'task-1',
      title: 'Practice speaking',
      description: '',
      goalId: 'goal-english',
      projectId: null,
      status: 'Done',
      priority: 'High',
      estimatedMinutes: 30,
      actualMinutes: 35,
      scheduledDate: '2026-08-24',
      deadline: null,
      completedAt: '2026-08-24T10:00:00.000Z',
      repeatType: 'None',
    }
    const english = goal({ id: 'goal-english', category: 'English', progressType: 'Manual' })
    const stats = calculateWeeklyStats([task], [english], [], [], new Date('2026-08-26T10:00:00'))
    expect(stats.completed).toBe(1)
    expect(stats.completionRate).toBe(100)
    expect(stats.plannedMinutes.English).toBe(30)
    expect(stats.actualMinutes.English).toBe(35)
  })
})
