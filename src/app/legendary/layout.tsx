export const metadata = {
  title: 'Ocean Intelligence Platform | Powered by Claude & Cursor',
  description: 'Revolutionary SST analysis and ocean feature detection platform',
}

export default function LegendaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
