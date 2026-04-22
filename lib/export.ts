import type { GeneratedCopy } from './prompts'

// ─── Markdown ─────────────────────────────────────────────────────────────────

export function generateMarkdown(copy: GeneratedCopy): string {
  const sections = copy.sections
    .filter((s) => s.enabled)
    .map((s) => `## ${s.title}\n\n${s.body}`)
    .join('\n\n---\n\n')

  return `${sections}\n\n---\n\n*Meta opis: ${copy.metaDescription}*`
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

export async function generateDocxBlob(copy: GeneratedCopy): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

  const spacer = new Paragraph({ text: '' })
  const divider = new Paragraph({ text: '─'.repeat(40) })

  const children = copy.sections
    .filter((s) => s.enabled)
    .flatMap((s, i) => [
      ...(i > 0 ? [divider, spacer] : []),
      new Paragraph({
        children: [new TextRun({ text: s.title, bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_2,
      }),
      ...s.body
        .split('\n')
        .map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 24 })] })),
      spacer,
    ])

  children.push(
    divider,
    spacer,
    new Paragraph({
      children: [
        new TextRun({ text: 'Meta opis: ', bold: true, size: 20, color: '888888' }),
        new TextRun({ text: copy.metaDescription, size: 20, color: '888888', italics: true }),
      ],
    }),
  )

  const doc = new Document({ sections: [{ properties: {}, children }] })
  return Packer.toBlob(doc)
}

// ─── PDF (via print window) ───────────────────────────────────────────────────

export function openPrintWindow(copy: GeneratedCopy): boolean {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return false
  w.document.write(buildPrintHtml(copy))
  w.document.close()
  w.addEventListener('load', () => setTimeout(() => w.print(), 300))
  return true
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function buildPrintHtml(copy: GeneratedCopy): string {
  const sections = copy.sections
    .filter((s) => s.enabled)
    .map((s) => `<div class="section"><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p></div>`)
    .join('<hr class="divider">')

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Copy Landing Page</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Georgia', serif; max-width: 740px; margin: 48px auto; padding: 0 24px; color: #111; line-height: 1.65; font-size: 15px; }
    h2 { font-size: 17px; font-weight: 700; margin: 28px 0 6px; color: #222; }
    p { margin: 0 0 12px; }
    .section { margin-bottom: 20px; }
    .divider { border: none; border-top: 1px solid #ddd; margin: 28px 0; }
    .meta { font-size: 12px; color: #888; font-style: italic; margin-top: 24px; }
    @media print { body { margin: 20px auto; } }
  </style>
</head>
<body>
  ${sections}
  <hr class="divider">
  <p class="meta">Meta opis: ${esc(copy.metaDescription)}</p>
</body>
</html>`
}

// ─── Shared download trigger ──────────────────────────────────────────────────

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
