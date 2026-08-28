import { endOfDay, endOfISOWeek, format, getISOWeek, getISOWeekYear, parseISO, startOfISOWeek } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import type { Language } from '../i18n'

export const dateKey = (date = new Date()) => format(date, 'yyyy-MM-dd')
export const todayKey = () => dateKey(new Date())
export const isoWeekKey = (date = new Date()) => `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
export const weekBounds = (date = new Date()) => ({ start: startOfISOWeek(date), end: endOfISOWeek(date) })
export const dateInRange = (value: string, start: Date, end: Date) => {
  const parsed = parseISO(value)
  return parsed >= start && parsed <= end
}
export const dateTimeInRange = (value: string, start: Date, end: Date) => {
  const parsed = new Date(value)
  return parsed >= start && parsed <= end
}
export const deadlineState = (deadline: string | null, status: string, now = new Date()) => {
  if (!deadline || status === 'Done' || status === 'Skipped') return 'normal'
  const due = endOfDay(parseISO(deadline))
  const remaining = due.getTime() - now.getTime()
  if (remaining < 0) return 'overdue'
  if (remaining < 48 * 60 * 60 * 1000) return 'urgent'
  return 'normal'
}
export const localeFor = (language: Language) => language === 'zh' ? zhCN : enUS
export const friendlyDate = (value: string, language: Language = 'en') => format(parseISO(value), language === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy', { locale: localeFor(language) })
export const friendlyDateTime = (value: string, language: Language = 'en') => format(new Date(value), language === 'zh' ? 'yyyy年M月d日 HH:mm' : 'MMM d, yyyy · h:mm a', { locale: localeFor(language) })
