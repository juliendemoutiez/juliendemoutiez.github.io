import { ref, onBeforeUnmount } from 'vue'

export const useGrist = (config = { tokenRefreshInterval: 14 * 60 * 1000 }) => {
  const gristTokenInfo = ref(null)
  let tokenRefreshTimeout = null

  const initializeToken = async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tokenInfo = await grist.docApi.getAccessToken({})
        gristTokenInfo.value = tokenInfo
        return tokenInfo
      } catch {
        if (attempt === 3) throw new Error(`Token initialization failed after ${3} attempts`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  const executeQuery = async (query, args = []) => {
    if (!gristTokenInfo.value) throw new Error('Token not initialized')

    const sqlEndpoint = `${gristTokenInfo.value.baseUrl}/sql?auth=${gristTokenInfo.value.token}`
    const response = await fetch(sqlEndpoint, {
      method: 'POST',
      body: JSON.stringify({ sql: query, args }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.records
  }

  const fetchAttachment = async (attachmentId) => {
    if (!gristTokenInfo.value) throw new Error('Token not initialized')

    const src = `${gristTokenInfo.value.baseUrl}/attachments/${attachmentId}/download?auth=${gristTokenInfo.value.token}`
    const response = await fetch(src)
    if (!response.ok) throw new Error(`Failed to fetch attachment: ${response.status}`)

    return response
  }

  const startTokenRefresh = () => {
    const scheduleRefresh = () => {
      tokenRefreshTimeout = setTimeout(async () => {
        try {
          await initializeToken()
          scheduleRefresh()
        } catch (err) {
          setTimeout(() => scheduleRefresh(), 60000)
        }
      }, config.tokenRefreshInterval)
    }
    scheduleRefresh()
  }

  const setupSubscriptions = (callback) => {
    grist.onRecords(callback)
  }

  const initializeGrist = async () => {
    try {
      await grist.ready()
      await initializeToken()
      startTokenRefresh()
    } catch (err) {
      console.error('Grist initialization error:', err)
      throw err
    }
  }

  onBeforeUnmount(() => {
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout)
    }
  })

  return {
    gristTokenInfo,
    executeQuery,
    fetchAttachment,
    setupSubscriptions,
    initializeGrist,
    initializeToken,
  }
}
