// app/layout.js
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './providers';
import { SidebarProvider } from '@/context/SidebarContext';
import { AuthProvider } from '@/hooks/useAuth';
import { SettingsInitializer } from '@/components/SettingsInitializer';
import { getSetting } from '@/lib/settings';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

// Make metadata dynamic using async function
export async function generateMetadata() {
  const siteName = await getSetting('siteName');
  const siteDescription = await getSetting('siteDescription');
  
  return {
    title: siteName || 'Mikias Building Materials',
    description: siteDescription || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <SidebarProvider>
            <AuthProvider>
              <SettingsInitializer />
              {children}
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--color-card)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-border)',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: 'var(--color-success)',
                      secondary: 'var(--color-background)',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: 'var(--color-error)',
                      secondary: 'var(--color-background)',
                    },
                  },
                }}
              />
            </AuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}