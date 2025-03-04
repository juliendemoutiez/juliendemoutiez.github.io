import { ref } from 'vue'

export function useToast() {
  const toast = ref(null)
  let timeoutId = null

  const showToast = ({ type = 'success', title, message, duration = 3000 }) => {
    if (timeoutId) clearTimeout(timeoutId)

    toast.value = {
      type,
      title,
      message,
    }

    timeoutId = setTimeout(() => {
      hideToast()
    }, duration)
  }

  const hideToast = () => {
    toast.value = null
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const showSuccess = (message, title = 'Succès 🎉') => {
    showToast({ type: 'success', title, message })
  }

  const showError = (message, title = 'Erreur') => {
    showToast({ type: 'error', title, message })
  }

  return {
    toast,
    showSuccess,
    showError,
  }
}
