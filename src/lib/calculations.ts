import { endOfISOWeek, startOfISOWeek } from 'date-fns'
import type { Goal, LifeTask, MetricDefinition, MetricEntry, WeeklyStats } from '../types'
import { dateInRange, dateTimeInRange, dateKey } from './date'

export function calculateGoalProgress(goal: Goal): number {
  if (goal.progressType === 'Manual') return Math.min(100, Math.max(0, goal.manualProgress))
  const { startValue, targetValue, currentValue } = goal
  if (startValue == null || targetValue == null || currentValue == null) return 0
  if (startValue === targetValue) return currentValue === targetValue ? 100 : 0
  return Math.min(100, Math.max(0, ((currentValue - startValue) / (targetValue - startValue)) * 100))
}

export function calculateWeeklyStats(
  tasks: LifeTask[],
  goals: Goal[],
  metricDefinitions: MetricDefinition[],
  entries: MetricEntry[],
  anchor = new Date(),
): WeeklyStats {
  const start = startOfISOWeek(anchor)
  const end = endOfISOWeek(anchor)
  const completedTasks = tasks.filter((task) => task.completedAt && dateTimeInRange(task.completedAt, start, end))
  const consideredIds = new Set<string>()
  tasks.forEach((task) => {
    if (task.completedAt && dateTimeInRange(task.completedAt, start, end)) consideredIds.add(task.id)
    else if (task.status === 'Skipped' && (task.scheduledDate || task.deadline)) {
      const key = task.scheduledDate ?? task.deadline!
      if (dateInRange(key, start, end)) consideredIds.add(task.id)
    } else if (task.status !== 'Done' && task.status !== 'Skipped') {
      const scheduledInWeek = task.scheduledDate ? dateInRange(task.scheduledDate, start, end) : false
      const deadlineInWeek = task.deadline ? dateInRange(task.deadline, start, end) : false
      if (scheduledInWeek || deadlineInWeek) consideredIds.add(task.id)
    }
  })

  const goalById = new Map(goals.map((goal) => [goal.id, goal]))
  const plannedMinutes: Record<string, number> = {}
  const actualMinutes: Record<string, number> = {}
  tasks.forEach((task) => {
    const category = task.goalId ? goalById.get(task.goalId)?.category ?? 'Uncategorized' : 'Uncategorized'
    if (task.scheduledDate && dateInRange(task.scheduledDate, start, end)) {
      plannedMinutes[category] = (plannedMinutes[category] ?? 0) + (task.estimatedMinutes ?? 0)
    }
  })
  completedTasks.forEach((task) => {
    const category = task.goalId ? goalById.get(task.goalId)?.category ?? 'Uncategorized' : 'Uncategorized'
    actualMinutes[category] = (actualMinutes[category] ?? 0) + (task.actualMinutes ?? task.estimatedMinutes ?? 0)
  })

  const weightMetricIds = new Set(metricDefinitions.filter((metric) => metric.name.toLowerCase() === 'weight').map((metric) => metric.id))
  const weightEntries = entries.filter((entry) => weightMetricIds.has(entry.metricId)).sort((a, b) => a.date.localeCompare(b.date))
  const beforeStart = weightEntries.filter((entry) => entry.date < dateKey(start)).at(-1)
  const atEnd = weightEntries.filter((entry) => entry.date <= dateKey(end)).at(-1)

  return {
    completed: completedTasks.length,
    denominator: consideredIds.size,
    completionRate: consideredIds.size ? (completedTasks.length / consideredIds.size) * 100 : null,
    plannedMinutes,
    actualMinutes,
    weightChange: beforeStart && atEnd ? atEnd.value - beforeStart.value : null,
  }
}

export const formatMinutes = (minutes: number) => {
  if (!minutes) return '0m'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
