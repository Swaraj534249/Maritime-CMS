import { getFileURL } from '../utils/fileUtils'

export const useDocumentActions = () => {
  const isPDF = (file) =>
    file?.mimetype === 'application/pdf' ||
    file?.filename?.toLowerCase().endsWith('.pdf') ||
    file?.originalName?.toLowerCase().endsWith('.pdf')

  const openDocument = (document) => {
    if (!document?.path) return

    const fileURL = getFileURL(document.path)

    if (isPDF(document)) {
      window.open(fileURL, '_blank')
      return
    }

    const link = document.createElement('a')
    link.href = fileURL
    link.download = document.originalName || document.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return { openDocument }
}
