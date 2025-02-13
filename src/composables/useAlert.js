import { ref } from 'vue'

export function useAlert() {
  const alert = ref(null)
  let timeoutId = null

  const showAlert = ({ type = 'success', title, message, duration = 3000 }) => {
    if (timeoutId) clearTimeout(timeoutId)

    alert.value = {
      type,
      title,
      message,
    }

    timeoutId = setTimeout(() => {
      hideAlert()
    }, duration)
  }

  const hideAlert = () => {
    alert.value = null
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const showSuccess = (message, title = 'Succès 🎉') => {
    showAlert({ type: 'success', title, message })
  }

  const showError = (message, title = 'Erreur') => {
    showAlert({ type: 'error', title, message })
  }

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
  }
}
