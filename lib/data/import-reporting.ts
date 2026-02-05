export type ImportRowError = {
  row: number
  message: string
}

export type ImportReportStatus = 'completed' | 'completed_with_errors'

export type ImportReport = {
  totalRows: number
  successCount: number
  errorCount: number
  successRate: number
  status: ImportReportStatus
  errors: ImportRowError[]
  storedErrors: ImportRowError[]
}

const DEFAULT_IMPORT_ERROR_MESSAGE = 'Row failed'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeCount = (value: number) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

const normalizeImportErrors = (errors: ImportRowError[]) =>
  errors
    .map((item, index) => {
      const normalizedRow = normalizeCount(item.row)
      const row = normalizedRow > 0 ? normalizedRow : index + 1
      const message = item.message.trim() || DEFAULT_IMPORT_ERROR_MESSAGE
      return { row, message }
    })
    .filter((item) => item.row > 0)

export const computeImportSuccessRate = (successCount: number, totalRows: number) => {
  const total = normalizeCount(totalRows)
  if (total === 0) return 0
  const success = clamp(normalizeCount(successCount), 0, total)
  return Math.round((success / total) * 100)
}

export const buildImportReport = (params: {
  totalRows: number
  successCount: number
  errors: ImportRowError[]
  maxStoredErrors?: number
}): ImportReport => {
  const totalRows = normalizeCount(params.totalRows)
  const normalizedErrors = normalizeImportErrors(params.errors)
  const maxErrorCount = totalRows
  const errors = normalizedErrors.slice(0, maxErrorCount)
  const errorCount = errors.length
  const successCeiling = Math.max(0, totalRows - errorCount)
  const successCount = clamp(normalizeCount(params.successCount), 0, successCeiling)
  const maxStoredErrors = normalizeCount(params.maxStoredErrors ?? 50)
  const storedErrors = errors.slice(0, maxStoredErrors)
  const successRate = computeImportSuccessRate(successCount, totalRows)
  const status: ImportReportStatus = errorCount > 0 ? 'completed_with_errors' : 'completed'

  return {
    totalRows,
    successCount,
    errorCount,
    successRate,
    status,
    errors,
    storedErrors,
  }
}
