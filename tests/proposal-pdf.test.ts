import { describe, expect, it } from 'vitest'
import { buildProposalPdf, toPdfFileName } from '@/lib/proposals/pdf'

describe('proposal pdf', () => {
  it('builds a valid pdf-like binary payload', () => {
    const bytes = buildProposalPdf({
      title: 'Sample Proposal',
      clientName: 'Acme',
      publicUrl: 'https://example.com/p/test',
      status: 'signed',
      signedAt: '2026-02-05T12:00:00.000Z',
      signerName: 'Jane Doe',
      total: 1200,
      currency: 'USD',
    })

    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('xref')
    expect(text).toContain('startxref')
    expect(text.endsWith('%%EOF')).toBe(true)
  })

  it('normalizes the output filename', () => {
    expect(toPdfFileName('Teklif #2026 / Enterprise', 'abc123')).toBe('teklif-2026-enterprise.pdf')
    expect(toPdfFileName('', 'abc123')).toBe('proposal-abc123.pdf')
  })
})
