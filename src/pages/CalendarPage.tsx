import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import zhCnLocale from '@fullcalendar/core/locales/zh-cn'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { Button, Card, PageHeader, Pill } from '../components/ui'
import { db } from '../db/database'
import { useI18n } from '../i18n'
import { useUIStore } from '../store/ui'

export function CalendarPage() {
  const { t, language } = useI18n()
  const data = useLiveQuery(async () => ({ tasks: await db.tasks.toArray(), milestones: await db.milestones.toArray() }), [])
  const openCapture = useUIStore((state) => state.openCapture)
  if (!data) return <div className="page loading-page">{t('calendar.loading')}</div>
  const events: EventInput[] = []
  data.tasks.forEach((task) => {
    if (task.scheduledDate) events.push({ id: `task:${task.id}`, title: task.title, start: task.scheduledDate, allDay: true, classNames: ['calendar-task', task.status === 'Done' ? 'calendar-done' : ''] })
    if (task.deadline && task.deadline !== task.scheduledDate) events.push({ id: `task:${task.id}`, title: t('calendar.duePrefix', { title: task.title }), start: task.deadline, allDay: true, classNames: ['calendar-deadline'] })
    if (task.deadline && task.deadline === task.scheduledDate) {
      const item = events.at(-1)
      if (item) item.classNames = ['calendar-task', 'calendar-deadline']
    }
  })
  data.milestones.forEach((milestone) => events.push({ id: `milestone:${milestone.id}`, title: milestone.title, start: milestone.date, allDay: true, classNames: ['calendar-milestone'] }))
  const dateClick = (info: DateClickArg) => openCapture('task', { scheduledDate: info.dateStr })
  const eventClick = (info: EventClickArg) => {
    const [kind, id] = info.event.id.split(':')
    if (kind === 'task') openCapture('task', { recordId: id })
    else if (id) openCapture('milestone', { recordId: id })
  }
  return <div className="page"><PageHeader eyebrow={t('calendar.eyebrow')} title={t('calendar.title')} description={t('calendar.description')} actions={<><Button variant="secondary" onClick={() => openCapture('milestone')}><Plus size={15} /> {t('capture.milestone')}</Button><Button onClick={() => openCapture('task')}><Plus size={15} /> {t('capture.task')}</Button></>} /><div className="calendar-legend"><Pill>{t('calendar.legendTask')}</Pill><Pill tone="danger">{t('calendar.legendDeadline')}</Pill><Pill tone="accent">{t('calendar.legendMilestone')}</Pill></div><Card className="calendar-card"><FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} locale={language === 'zh' ? zhCnLocale : 'en'} initialView="dayGridMonth" headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }} events={events} dateClick={dateClick} eventClick={eventClick} height="auto" dayMaxEvents={3} firstDay={1} /></Card></div>
}
