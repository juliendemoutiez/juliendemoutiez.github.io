export const formatNumber = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value)
}
