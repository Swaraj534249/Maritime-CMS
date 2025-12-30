export const getFileURL = (filePath) => {
  if (!filePath) return null
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000'
  return `${baseURL}/${filePath.replace(/\\/g, '/')}`
}
