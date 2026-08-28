import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ArrowRight, Award, CalendarClock, Check, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import { setTaskStatus } from '../db/repositories'
import { calculateGoalProgress } from '../lib/calculations'
import { dateKey, deadlineState, friendlyDate, localeFor, todayKey } from '../lib/date'
import { useI18n } from '../i18n'
import { useUIStore } from '../store/ui'
import type { LifeTask, TaskStatus } from '../types'
import { Button, Card, EmptyState, PageHeader, Pill, ProgressBar, SectionHeader } from '../components/ui'

const statuses: TaskStatus[] = ['Todo', 'In Progress', 'Done', 'Skipped']

export function DashboardPage() {
  const { t, label, language } = useI18n()
  const data = useLiveQuery(async () => {
    const [goals, projects, tasks, achievements] = await Promise.all([db.goals.toArray(), db.projects.toArray(), db.tasks.toArray(), db.achievements.toArray()])
    return { goals, projects, tasks, achievements }
  }, [])
  const openCapture = useUIStore((state) => state.openCapture)
  if (!data) return <div className="page loading-page">{t('common.loading')}</div>

  const today = todayKey()
  const activeGoals = data.goals.filter((goal) => goal.status === 'Active')
  const todayTasks = data.tasks.filter((task) => task.scheduledDate === today).sort(prioritySort)
  const upcomingLimit = dateKey(addDays(new Date(), 7))
  const deadlines = data.tasks.filter((task) => task.deadline && task.deadline >= today && task.deadline <= upcomingLimit && task.status !== 'Done' && task.status !== 'Skipped').sort((a, b) => a.deadline!.localeCompare(b.deadline!))
  const goalById = new Map(data.goals.map((goal) => [goal.id, goal]))
  const projectById = new Map(data.projects.map((project) => [project.id, project]))
  const recentAchievements = [...data.achievements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

  return <div className="page"><PageHeader eyebrow={format(new Date(), language === 'zh' ? 'M月d日 EEEE' : 'EEEE · MMMM d', { locale: localeFor(language) })} title={t('dashboard.greeting')} description={t('dashboard.description')} actions={<Button onClick={() => openCapture('task')}><Plus size={16} /> {t('dashboard.quickAdd')}</Button>} />
    <div className="quick-capture" aria-label={t('dashboard.captureSeconds')}><span><Sparkles size={16} /> {t('dashboard.captureSeconds')}</span><button onClick={() => openCapture('task')}>{t('capture.task')}</button><button onClick={() => openCapture('thought')}>{t('capture.thought')}</button><button onClick={() => openCapture('achievement')}>{t('capture.achievement')}</button></div>
    <div className="dashboard-grid"><div className="dashboard-main">
      <Card><SectionHeader title={t('dashboard.todayFocus')} meta={t('dashboard.completedCount', { done: todayTasks.filter((task) => task.status === 'Done').length, total: todayTasks.length })} actions={<button className="text-button" onClick={() => openCapture('task', { scheduledDate: today })}>{t('dashboard.addTask')} <Plus size={14} /></button>} />{todayTasks.length ? <div className="task-list">{todayTasks.map((task) => <TaskRow key={task.id} task={task} goal={task.goalId ? goalById.get(task.goalId)?.title : undefined} project={task.projectId ? projectById.get(task.projectId)?.title : undefined} />)}</div> : <EmptyState title={t('dashboard.clearDay')} description={t('dashboard.clearDayDesc')} action={<Button onClick={() => openCapture('task', { scheduledDate: today })}>{t('dashboard.addTodayFocus')}</Button>} />}</Card>
      <Card><SectionHeader title={t('dashboard.upcomingDeadlines')} meta={t('dashboard.next7Days')} />{deadlines.length ? <div className="deadline-list">{deadlines.map((task) => { const state = deadlineState(task.deadline, task.status); const days = differenceInCalendarDays(parseISO(task.deadline!), new Date()); return <button key={task.id} className="deadline-row" onClick={() => openCapture('task', { recordId: task.id })}><span className={`deadline-icon ${state}`}><CalendarClock size={17} /></span><span className="deadline-copy"><strong>{task.title}</strong><small>{task.goalId ? goalById.get(task.goalId)?.title : t('dashboard.unlinkedTask')}</small></span><span className={`deadline-time ${state}`}>{days === 0 ? t('common.today') : days === 1 ? t('common.tomorrow') : t('dashboard.days', { count: days })}<small>{friendlyDate(task.deadline!, language)}</small></span></button> })}</div> : <EmptyState title={t('dashboard.noDeadlines')} description={t('dashboard.noDeadlinesDesc')} />}</Card>
    </div><aside className="dashboard-side"><Card><SectionHeader title={t('dashboard.activeGoals')} meta={`${activeGoals.length}`} />{activeGoals.map((goal) => <Link className="goal-mini-card" key={goal.id} to={`/goals/${goal.id}`}><div><Pill tone="accent">{label(goal.category)}</Pill><ArrowRight size={15} /></div><strong>{goal.title}</strong>{goal.progressType === 'Metric' && <small>{goal.currentValue} {goal.unit} → {goal.targetValue} {goal.unit}</small>}<ProgressBar value={calculateGoalProgress(goal)} /></Link>)}</Card><Card><SectionHeader title={t('dashboard.recentAchievements')} actions={<Link className="text-button" to="/achievements">{t('dashboard.viewAll')}</Link>} />{recentAchievements.length ? <div className="achievement-mini-list">{recentAchievements.map((item) => <div key={item.id}><span><Award size={15} /></span><div><strong>{item.title}</strong><small>{friendlyDate(item.date, language)}</small></div></div>)}</div> : <EmptyState title={t('dashboard.timelineStarts')} description={t('dashboard.timelineStartsDesc')} />}</Card></aside></div>
  </div>
}

function TaskRow({ task, goal, project }: { task: LifeTask; goal?: string; project?: string }) {
  const { t, label } = useI18n()
  const openCapture = useUIStore((state) => state.openCapture)
  return <div className={`task-row ${task.status === 'Done' ? 'is-done' : ''}`}><button className="task-check" aria-label={task.status === 'Done' ? t('dashboard.markTodo', { title: task.title }) : t('dashboard.completeTask', { title: task.title })} onClick={() => void setTaskStatus(task, task.status === 'Done' ? 'Todo' : 'Done')}>{task.status === 'Done' && <Check size={14} />}</button><button className="task-copy" onClick={() => openCapture('task', { recordId: task.id })}><strong>{task.title}</strong><span>{goal ?? t('dashboard.unlinked')}{project ? ` · ${project}` : ''}</span></button><Pill tone={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'neutral'}>{label(task.priority)}</Pill>{task.estimatedMinutes && <span className="task-duration">{task.estimatedMinutes}m</span>}<select aria-label={t('dashboard.statusFor', { title: task.title })} value={task.status} onChange={(event) => void setTaskStatus(task, event.target.value as TaskStatus)}>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></div>
}

function prioritySort(a: LifeTask, b: LifeTask) {
  const rank = { High: 0, Medium: 1, Low: 2 }
  return rank[a.priority] - rank[b.priority]
}
