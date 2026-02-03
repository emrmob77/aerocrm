'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'
import { useI18n } from '@/lib/i18n'

type EntityId = 'contacts' | 'deals' | 'proposals' | 'sales'

type FieldOption = {
  id: string
  label: string
  required?: boolean
}

type EntityConfig = {
  id: EntityId
  label: string
  description: string
  fields: FieldOption[]
}

type ImportLog = {
  id: string
  entity: string
  status: string
  total_rows: number
  success_count: number
  error_count: number
  file_name: string | null
  created_at: string
}

type ExportLog = {
  id: string
  entity: string
  status: string
  row_count: number
  file_name: string | null
  created_at: string
}

type ParsedCsv = {
  headers: string[]
  rows: string[][]
}

const buildEntityConfigs = (t: (key: string) => string): EntityConfig[] => [
  {
    id: 'contacts',
    label: t('importExport.entities.contacts.label'),
    description: t('importExport.entities.contacts.description'),
    fields: [
      { id: 'full_name', label: t('importExport.fields.fullName'), required: true },
      { id: 'email', label: t('importExport.fields.email') },
      { id: 'phone', label: t('importExport.fields.phone') },
      { id: 'company', label: t('importExport.fields.company') },
      { id: 'position', label: t('importExport.fields.position') },
      { id: 'address', label: t('importExport.fields.address') },
    ],
  },
  {
    id: 'deals',
    label: t('importExport.entities.deals.label'),
    description: t('importExport.entities.deals.description'),
    fields: [
      { id: 'title', label: t('importExport.fields.dealTitle'), required: true },
      { id: 'value', label: t('importExport.fields.amount') },
      { id: 'currency', label: t('importExport.fields.currency') },
      { id: 'stage', label: t('importExport.fields.stage') },
      { id: 'expected_close_date', label: t('importExport.fields.expectedClose') },
      { id: 'probability', label: t('importExport.fields.probability') },
      { id: 'notes', label: t('importExport.fields.notes') },
      { id: 'contact_name', label: t('importExport.fields.contactName') },
      { id: 'contact_email', label: t('importExport.fields.contactEmail') },
      { id: 'contact_id', label: t('importExport.fields.contactId') },
    ],
  },
  {
    id: 'proposals',
    label: t('importExport.entities.proposals.label'),
    description: t('importExport.entities.proposals.description'),
    fields: [
      { id: 'title', label: t('importExport.fields.proposalTitle'), required: true },
      { id: 'status', label: t('importExport.fields.status') },
      { id: 'expires_at', label: t('importExport.fields.expiresAt') },
      { id: 'deal_id', label: t('importExport.fields.dealId') },
      { id: 'contact_name', label: t('importExport.fields.contactName') },
      { id: 'contact_email', label: t('importExport.fields.contactEmail') },
      { id: 'contact_id', label: t('importExport.fields.contactId') },
    ],
  },
  {
    id: 'sales',
    label: t('importExport.entities.sales.label'),
    description: t('importExport.entities.sales.description'),
    fields: [
      { id: 'title', label: t('importExport.fields.salesTitle'), required: true },
      { id: 'value', label: t('importExport.fields.amount') },
      { id: 'currency', label: t('importExport.fields.currency') },
      { id: 'sales_date', label: t('importExport.fields.salesDate') },
      { id: 'notes', label: t('importExport.fields.notes') },
      { id: 'contact_name', label: t('importExport.fields.contactName') },
      { id: 'contact_email', label: t('importExport.fields.contactEmail') },
      { id: 'contact_id', label: t('importExport.fields.contactId') },
    ],
  },
]

const autoMapDictionary: Record<string, string> = {
  'ad': 'full_name',
  'ad soyad': 'full_name',
  'isim': 'full_name',
  'full name': 'full_name',
  'name': 'full_name',
  'e-posta': 'email',
  'email': 'email',
  'mail': 'email',
  'telefon': 'phone',
  'phone': 'phone',
  'şirket': 'company',
  'company': 'company',
  'pozisyon': 'position',
  'title': 'title',
  'deal title': 'title',
  'tutar': 'value',
  'amount': 'value',
  'value': 'value',
  'price': 'price',
  'para birimi': 'currency',
  'currency': 'currency',
  'stage': 'stage',
  'aşama': 'stage',
  'durum': 'status',
  'status': 'status',
  'kategori': 'category',
  'category': 'category',
  'açıklama': 'description',
  'description': 'description',
  'notlar': 'notes',
  'notes': 'notes',
  'müşteri adı': 'contact_name',
  'contact name': 'contact_name',
  'müşteri e-posta': 'contact_email',
  'contact email': 'contact_email',
  'customer email': 'contact_email',
  'contact id': 'contact_id',
  'müşteri id': 'contact_id',
  'son tarih': 'expires_at',
  'expires at': 'expires_at',
  'tahmini kapanış': 'expected_close_date',
  'expected close date': 'expected_close_date',
  'satış tarihi': 'sales_date',
  'sales date': 'sales_date',
  'closed date': 'sales_date',
}

const detectDelimiter = (line: string) => {
  const delimiters = [',', ';', '\t']
  let winner = ','
  let bestCount = 0
  delimiters.forEach((delimiter) => {
    const count = line.split(delimiter).length
    if (count > bestCount) {
      bestCount = count
      winner = delimiter
    }
  })
  return winner
}

const parseCsv = (content: string): ParsedCsv => {
  const text = content.replace(/^\uFEFF/, '')
  const firstLine = text.split(/\r?\n/)[0] ?? ''
  const delimiter = detectDelimiter(firstLine)
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentValue)
      currentValue = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1
      }
      currentRow.push(currentValue)
      if (currentRow.some((value) => value.trim() !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
      currentValue = ''
      continue
    }

    currentValue += char
  }

  currentRow.push(currentValue)
  if (currentRow.some((value) => value.trim() !== '')) {
    rows.push(currentRow)
  }

  const headers = rows[0]?.map((header) => header.trim()) ?? []
  const bodyRows = rows.slice(1)
  return { headers, rows: bodyRows }
}

export default function ImportExportPage() {
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const entityConfigs = useMemo(() => buildEntityConfigs(t), [t])
  const [entity, setEntity] = useState<EntityId>('contacts')
  const [exportEntity, setExportEntity] = useState<EntityId>('contacts')
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv')
  const [exportDelimiter, setExportDelimiter] = useState<'comma' | 'semicolon' | 'tab'>('semicolon')
  const [fileName, setFileName] = useState('')
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    successCount: number
    errorCount: number
    errors: { row: number; message: string }[]
  } | null>(null)
  const [logs, setLogs] = useState<{ imports: ImportLog[]; exports: ExportLog[] }>({
    imports: [],
    exports: [],
  })

  const currentConfig = useMemo(
    () => entityConfigs.find((item) => item.id === entity) ?? entityConfigs[0],
    [entity, entityConfigs]
  )

  const requiredFields = useMemo(
    () => currentConfig.fields.filter((field) => field.required).map((field) => field.id),
    [currentConfig.fields]
  )

  const columnSamples = useMemo(() => {
    if (!parsedCsv) return []
    return parsedCsv.headers.map((header, index) => {
      const sample = parsedCsv.rows.find((row) => row[index]?.trim())?.[index] ?? ''
      return { index, header, sample }
    })
  }, [parsedCsv])

  const previewRows = useMemo(() => {
    if (!parsedCsv) return []
    return parsedCsv.rows.slice(0, 5)
  }, [parsedCsv])

  const loadLogs = async () => {
    const response = await fetch('/api/data/logs')
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return
    }
    setLogs({
      imports: (payload?.imports ?? []) as ImportLog[],
      exports: (payload?.exports ?? []) as ExportLog[],
    })
  }

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    const paramEntity = searchParams.get('entity')
    if (
      paramEntity &&
      ['contacts', 'deals', 'proposals', 'sales'].includes(paramEntity)
    ) {
      setEntity(paramEntity as EntityId)
      setExportEntity(paramEntity as EntityId)
    }
  }, [searchParams])

  useEffect(() => {
    if (!parsedCsv) return
    const nextMapping: Record<number, string> = {}
    parsedCsv.headers.forEach((header, index) => {
      const normalized = header.trim().toLowerCase()
      const mapped = autoMapDictionary[normalized]
      if (mapped) {
        nextMapping[index] = mapped
      }
    })
    setMapping(nextMapping)
  }, [parsedCsv, entity])

  const handleFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseCsv(text)
    setParsedCsv(parsed)
    setFileName(file.name)
    setImportResult(null)
    if (!parsed.headers.length) {
    toast.error(t('importExport.errors.headerMissing'))
    }
  }

  const handleImport = async () => {
    if (!parsedCsv) {
    toast.error(t('importExport.errors.uploadFirst'))
      return
    }
    const mappedFields = Object.values(mapping).filter(Boolean)
    const missingRequired = requiredFields.filter((field) => !mappedFields.includes(field))
    if (missingRequired.length > 0) {
    toast.error(t('importExport.errors.matchRequired'))
      return
    }

    const rows = parsedCsv.rows
      .map((row) => {
        const result: Record<string, string | null> = {}
        row.forEach((value, index) => {
          const field = mapping[index]
          if (!field) return
          result[field] = value?.trim() || null
        })
        return result
      })
      .filter((row) => Object.keys(row).length > 0)

    if (!rows.length) {
    toast.error(t('importExport.errors.noRows'))
      return
    }

    setIsImporting(true)
    const response = await fetch('/api/data/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity,
        fileName,
        rows,
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || t('importExport.errors.importFailed'))
      setIsImporting(false)
      return
    }
    setImportResult({
      successCount: payload?.successCount ?? 0,
      errorCount: payload?.errorCount ?? 0,
      errors: payload?.errors ?? [],
    })
    setIsImporting(false)
    await loadLogs()
    toast.success(t('importExport.success.imported'))
  }

  const handleExport = async () => {
    const response = await fetch(
      `/api/data/export?entity=${exportEntity}&format=${exportFormat}&delimiter=${exportDelimiter}`
    )
    if (!response.ok) {
      toast.error(t('importExport.errors.exportFailed'))
      return
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileNameHeader = response.headers.get('Content-Disposition') ?? ''
    const match = fileNameHeader.match(/filename="(.+)"/)
    link.href = url
    link.download = match?.[1] ?? `aero-${exportEntity}.${exportFormat === 'excel' ? 'xls' : 'csv'}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    await loadLogs()
  }

  const downloadTemplate = () => {
    const headers = currentConfig.fields.map((field) => field.id)
    const content = `${headers.join(',')}\n`
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aero-${currentConfig.id}-template.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="-m-8">
      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">swap_vert</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Data Operations</span>
            </div>
            <h1 className="text-3xl font-black text-[#0f172a] dark:text-white">{t('importExport.title')}</h1>
            <p className="text-sm text-slate-500">{t('importExport.subtitle')}</p>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('importExport.import.title')}</h2>
              <p className="text-xs text-slate-500 mt-1">{t('importExport.import.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e2e8f0] text-slate-600 text-sm font-semibold hover:border-primary/40 hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">file_download</span>
                {t('importExport.import.downloadTemplate')}
              </button>
              <button
                onClick={() => {
                  setParsedCsv(null)
                  setFileName('')
                  setImportResult(null)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e2e8f0] text-slate-600 text-sm font-semibold hover:border-primary/40 hover:text-primary"
              >
                <span className="material-symbols-outlined text-lg">restart_alt</span>
                Temizle
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {entityConfigs.map((item) => (
              <button
                key={item.id}
                onClick={() => setEntity(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  entity === item.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="border border-dashed border-[#cbd5f5] rounded-xl p-4 bg-[#f8fafc]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{t('importExport.import.csvFile')}</p>
                <p className="text-xs text-slate-500">
                  {fileName ? fileName : t('importExport.import.uploadHint', { entity: currentConfig.label })}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer">
                <span className="material-symbols-outlined text-lg">upload_file</span>
                {t('importExport.import.chooseFile')}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      handleFile(file)
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {parsedCsv && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columnSamples.map((column) => (
                  <div key={column.index} className="border border-[#e2e8f0] rounded-xl p-3">
                    <p className="text-xs font-semibold text-slate-500">{column.header || `Kolon ${column.index + 1}`}</p>
                    <p className="text-sm text-slate-700 mt-1 truncate">{column.sample || '—'}</p>
                    <select
                      value={mapping[column.index] ?? ''}
                      onChange={(event) => {
                        setMapping((prev) => ({ ...prev, [column.index]: event.target.value }))
                      }}
                      className="mt-2 w-full px-2 py-1.5 rounded-lg border border-[#e2e8f0] text-sm"
                    >
                      <option value="">{t('importExport.import.noMapping')}</option>
                      {currentConfig.fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label}{field.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">{t('importExport.import.preview')}</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-400">
                        {parsedCsv.headers.map((header, index) => (
                          <th key={index} className="py-1 pr-3">
                            {header || `Kolon ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="text-slate-600">
                          {row.map((value, colIndex) => (
                            <td key={colIndex} className="py-1 pr-3 truncate">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                <span className="material-symbols-outlined">download</span>
                {isImporting ? t('importExport.import.importing') : t('importExport.import.cta')}
              </button>
            </div>
          )}

          {importResult && (
            <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50">
              <p className="text-sm font-bold text-emerald-700">{t('importExport.success.imported')}</p>
              <p className="text-xs text-emerald-600 mt-1">
                {t('importExport.import.result', { success: importResult.successCount, error: importResult.errorCount })}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto text-xs text-emerald-700 space-y-1">
                  {importResult.errors.slice(0, 6).map((error, index) => (
                    <p key={index}>
                      {t('importExport.import.rowError', { row: error.row, message: error.message })}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('importExport.export.title')}</h2>
              <p className="text-xs text-slate-500 mt-1">{t('importExport.export.subtitle')}</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              {t('importExport.export.cta')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={exportEntity}
              onChange={(event) => setExportEntity(event.target.value as EntityId)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
            >
              {entityConfigs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value as 'csv' | 'excel')}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
            >
              <option value="csv">CSV (Excel uyumlu)</option>
              <option value="excel">Excel (XLS)</option>
            </select>
            {exportFormat === 'csv' && (
              <select
                value={exportDelimiter}
                onChange={(event) =>
                  setExportDelimiter(event.target.value as 'comma' | 'semicolon' | 'tab')
                }
                className="px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm"
              >
                <option value="semicolon">CSV (;) - TR Excel</option>
                <option value="comma">CSV (,) - EN</option>
                <option value="tab">TSV (Tab)</option>
              </select>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('importExport.history.import')}</h3>
            <div className="mt-4 space-y-3">
              {logs.imports.length === 0 ? (
                <p className="text-xs text-slate-500">{t('importExport.history.empty')}</p>
              ) : (
                logs.imports.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.entity}</p>
                      <p className="text-xs text-slate-400">{item.file_name || t('importExport.history.importFallback')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatRelativeTime(item.created_at, t)}</p>
                      <p className="text-xs text-slate-600">
                        {t('importExport.history.success', { success: item.success_count, total: item.total_rows })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('importExport.history.export')}</h3>
            <div className="mt-4 space-y-3">
              {logs.exports.length === 0 ? (
                <p className="text-xs text-slate-500">{t('importExport.history.empty')}</p>
              ) : (
                logs.exports.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.entity}</p>
                      <p className="text-xs text-slate-400">{item.file_name || t('importExport.history.exportFallback')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatRelativeTime(item.created_at, t)}</p>
                      <p className="text-xs text-slate-600">{t('importExport.history.rows', { count: item.row_count })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
