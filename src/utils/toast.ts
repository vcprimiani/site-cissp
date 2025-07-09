// Global toast instance
let toastInstance: {
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
} | null = null

// Initialize the toast instance
export const initializeToast = (toast: typeof toastInstance) => {
  toastInstance = toast
}

// Toast utility functions
export const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
  if (!toastInstance) {
    console.warn('Toast not initialized. Call initializeToast first.')
    return
  }

  switch (type) {
    case 'success':
      toastInstance.showSuccess(title, message)
      break
    case 'error':
      toastInstance.showError(title, message)
      break
    case 'warning':
      toastInstance.showWarning(title, message)
      break
    case 'info':
      toastInstance.showInfo(title, message)
      break
  }
} 