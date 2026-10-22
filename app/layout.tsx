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

const description =
  "Contanos qué auto tenés y cuál querés. Falkenberg lo consigue, tasa el tuyo y te da el número final."

export const metadata: Metadata = {
  title: "Falkenberg Meyer Automotores — Rafaela",
  description,
  applicationName: "Falkenberg Meyer Automotores",
  openGraph: {
    title: "Falkenberg Meyer Automotores — Rafaela",
    description,
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
