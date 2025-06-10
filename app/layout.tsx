import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { OfflineIndicator } from "@/components/offline-indicator"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Home Treatment App",
  description: "Request healthcare services from home",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <OfflineIndicator />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
