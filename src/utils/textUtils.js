export const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/[éèêë]/g, 'e')
    .replace(/[àáâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ÿ/g, 'y')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/[-']/g, '')
}
