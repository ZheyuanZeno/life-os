import { create } from 'zustand'

export type CaptureType = 'task' | 'thought' | 'achievement' | 'milestone'

export interface CaptureDefaults {
  goalId?: string
  projectId?: string
  scheduledDate?: string
  date?: string
  recordId?: string
}

interface UIState {
  captureOpen: boolean
  captureType: CaptureType
  captureDefaults: CaptureDefaults
  openCapture: (type?: CaptureType, defaults?: CaptureDefaults) => void
  closeCapture: () => void
}

export const useUIStore = create<UIState>((set) => ({
  captureOpen: false,
  captureType: 'task',
  captureDefaults: {},
  openCapture: (captureType = 'task', captureDefaults = {}) => set({ captureOpen: true, captureType, captureDefaults }),
  closeCapture: () => set({ captureOpen: false, captureDefaults: {} }),
}))
