export const formatPhoneNumber = (number, indicator) => {
  if (!number) return ''
  const numbers = number.replace(/\D/g, '')
  if (
    (indicator.length === 3 && numbers.length === 10) ||
    (indicator.length === 4 && numbers.length === 8)
  ) {
    return numbers.replace(/(\d{2})(?=\d)/g, '$1 ')
  }
  return numbers
}
