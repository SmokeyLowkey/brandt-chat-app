import type { Metadata } from 'next'
import { AuthProvider } from '@/providers/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { UploadProvider } from '@/providers/upload-provider'
import { TenantProvider } from '@/providers/tenant-provider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'PartsIQ AI Assistant',
  description: 'AI-powered assistant for the aftersales parts industry',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <TenantProvider>
            <UploadProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                {children}
                <Toaster position="top-right" />
              </ThemeProvider>
            </UploadProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
