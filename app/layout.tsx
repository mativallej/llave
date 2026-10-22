import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Falkenberg Meyer Automotores — Comprá, vendé o cambiá tu auto en Rafaela",
  description:
    "Concesionaria multimarca en Rafaela hace 12 años. 0km y usados con permuta. Te respondemos por WhatsApp en 24-48hs. 4,6★ en Google.",
  generator: "Llave",
  applicationName: "Falkenberg Meyer Automotores",
  keywords: [
    "Falkenberg Meyer",
    "concesionaria Rafaela",
    "autos usados Santa Fe",
    "permuta autos",
    "comprar auto Rafaela",
    "vender auto Rafaela",
  ],
  openGraph: {
    title: "Falkenberg Meyer Automotores — Rafaela",
    description:
      "Comprá, vendé o cambiá tu auto. Te respondemos por WhatsApp en 24-48hs. 4,6★ en Google.",
    type: "website",
    locale: "es_AR",
    siteName: "Falkenberg Meyer Automotores",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
