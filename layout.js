import './globals.css'

export const metadata = {
  title: 'HOA Management System',
  description: 'Professional Condo Management Portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
