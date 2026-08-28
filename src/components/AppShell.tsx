import { Award, CalendarDays, Gauge, Goal, Languages, ListTodo, NotebookPen, Plus, Settings, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useUIStore } from '../store/ui'
import { useI18n } from '../i18n'

const primary = [
  { to: '/', label: 'nav.dashboard', icon: Gauge },
  { to: '/calendar', label: 'nav.calendar', icon: CalendarDays },
  { to: '/goals', label: 'nav.goals', icon: Goal },
  { to: '/achievements', label: 'nav.achievements', icon: Award },
  { to: '/journal', label: 'nav.journal', icon: NotebookPen },
  { to: '/task-notes', label: 'nav.taskNotes', icon: ListTodo },
] as const

export function AppShell({ children }: { children: ReactNode }) {
  const openCapture = useUIStore((state) => state.openCapture)
  const { language, toggleLanguage, t } = useI18n()
  const switchLabel = language === 'en' ? t('language.toChinese') : t('language.toEnglish')
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Sparkles size={16} /></span><div><strong>Life OS</strong><small>{t('app.tagline')}</small></div></div><nav aria-label={t('nav.dashboard')}>{primary.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={18} /><span>{t(label)}</span></NavLink>)}</nav><div className="sidebar-lower"><button className="language-button" onClick={toggleLanguage} aria-label={switchLabel}><Languages size={18} /><span>{language === 'en' ? '中文' : 'English'}</span></button><button onClick={() => openCapture('task')}><Plus size={18} /><span>{t('nav.quickAdd')}</span><kbd>Q</kbd></button><NavLink to="/settings"><Settings size={18} /><span>{t('nav.settings')}</span></NavLink></div></aside><main className="main-content">{children}</main><button className="mobile-language" onClick={toggleLanguage} aria-label={switchLabel}><Languages size={15} />{language === 'en' ? '中文' : 'EN'}</button><nav className="mobile-nav" aria-label={t('nav.dashboard')}>{primary.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={19} /><span>{t(label)}</span></NavLink>)}</nav></div>
}
