export const formatDate = (date) => {
  if (!date) return null
  return new Date(date * 1000).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
