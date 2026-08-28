import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CaptureDialog } from './components/CaptureDialog'
import { useUIStore } from './store/ui'
import { useI18n } from './i18n'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((module) => ({ default: module.GoalsPage })))
const AchievementsPage = lazy(() => import('./pages/AchievementsPage').then((module) => ({ default: module.AchievementsPage })))
const JournalPage = lazy(() => import('./pages/JournalPage').then((module) => ({ default: module.JournalPage })))
const TaskNotesPage = lazy(() => import('./pages/TaskNotesPage').then((module) => ({ default: module.TaskNotesPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

function App() {
  const openCapture = useUIStore((state) => state.openCapture)
  const { t } = useI18n()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key.toLowerCase() === 'q' && !event.metaKey && !event.ctrlKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) openCapture('task')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCapture])

  return <AppShell><Suspense fallback={<div className="page loading-page">{t('common.loading')}</div>}><Routes><Route path="/" element={<DashboardPage />} /><Route path="/calendar" element={<CalendarPage />} /><Route path="/goals" element={<GoalsPage />} /><Route path="/goals/:goalId" element={<GoalsPage />} /><Route path="/achievements" element={<AchievementsPage />} /><Route path="/journal" element={<JournalPage />} /><Route path="/task-notes" element={<TaskNotesPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense><CaptureDialog /></AppShell>
}

export default App
