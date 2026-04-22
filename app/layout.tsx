import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Empatify — Generator Copy Landing Page',
  description: 'Twórz copy landing page spójne z archetypem Twojej marki',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
