import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Brak pliku' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let text = ''

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfParse = (await import('pdf-parse')).default
        const data = await pdfParse(buffer)
        text = data.text
      } catch {
        return NextResponse.json(
          { error: `${file.name}: nie udało się odczytać PDF` },
          { status: 400 },
        )
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      try {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        text = result.value
      } catch {
        return NextResponse.json(
          { error: `${file.name}: nie udało się odczytać DOCX` },
          { status: 400 },
        )
      }
    } else {
      text = buffer.toString('utf-8')
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: `${file.name}: plik jest pusty lub nie zawiera tekstu` },
        { status: 400 },
      )
    }

    return NextResponse.json({ text: text.slice(0, 12000), filename: file.name })
  } catch (error) {
    console.error('Extract text error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd odczytu pliku' },
      { status: 500 },
    )
  }
}
