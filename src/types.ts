export const goalCategories = ['Health', 'English', 'Research', 'Academic', 'Career', 'Life', 'Other'] as const
export type GoalCategory = (typeof goalCategories)[number]
export type GoalStatus = 'Active' | 'Paused' | 'Completed' | 'Archived'
export type GoalProgressType = 'Manual' | 'Metric'
export type ProjectStatus = 'Active' | 'Completed' | 'Paused' | 'Archived'
export type TaskStatus = 'Todo' | 'In Progress' | 'Done' | 'Skipped'
export type TaskPriority = 'Low' | 'Medium' | 'High'
export type RepeatType = 'None' | 'Daily' | 'Weekly'

export interface AuditFields {
  createdAt: string
  updatedAt: string
  demoSetId?: string | null
}

export interface Goal extends AuditFields {
  id: string
  title: string
  description: string
  category: GoalCategory
  status: GoalStatus
  startDate: string
  targetDate: string | null
  progressType: GoalProgressType
  startValue: number | null
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  manualProgress: number
  primaryMetricId: string | null
}

export interface Project extends AuditFields {
  id: string
  goalId: string
  title: string
  description: string
  status: ProjectStatus
  startDate: string
  targetDate: string | null
}

export interface LifeTask extends AuditFields {
  id: string
  title: string
  description: string
  goalId: string | null
  projectId: string | null
  status: TaskStatus
  priority: TaskPriority
  estimatedMinutes: number | null
  actualMinutes: number | null
  scheduledDate: string | null
  deadline: string | null
  completedAt: string | null
  repeatType: RepeatType
}

export interface Milestone extends AuditFields {
  id: string
  title: string
  description: string
  goalId: string | null
  category: GoalCategory
  date: string
}

export interface MetricDefinition extends AuditFields {
  id: string
  name: string
  category: GoalCategory
  unit: string
  goalId: string | null
}

export interface MetricEntry extends AuditFields {
  id: string
  metricId: string
  value: number
  date: string
  note: string
}

export interface Achievement extends AuditFields {
  id: string
  title: string
  description: string
  date: string
  goalId: string | null
  category: GoalCategory
}

export interface GoalNote extends AuditFields {
  id: string
  goalId: string
  content: string
}

export interface DailyJournal extends AuditFields {
  id: string
  date: string
  content: string
  mood: number
  energy: number
  editHistory: string[]
}

export interface Thought extends AuditFields {
  id: string
  title: string
  content: string
  tags: string[]
  editHistory: string[]
}

export interface WeeklyReview extends AuditFields {
  id: string
  weekKey: string
  wentWell: string
  didntGoWell: string
  biggestAchievementId: string | null
  biggestProblem: string
  nextWeekFocus: string[]
}

export interface AppSetting {
  key: string
  value: string
  updatedAt: string
}

export interface WeeklyStats {
  completed: number
  denominator: number
  completionRate: number | null
  plannedMinutes: Record<string, number>
  actualMinutes: Record<string, number>
  weightChange: number | null
}
