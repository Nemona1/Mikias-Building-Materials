// app/layout.js - Enhanced with performance optimizations
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './providers';
import { SidebarProvider } from '@/context/SidebarContext';
import { AuthProvider } from '@/hooks/useAuth';
import { SettingsInitializer } from '@/components/SettingsInitializer';
import { getSetting } from '@/lib/settings';
import 'leaflet/dist/leaflet.css';
import './globals.css';

// Optimize font loading with preload
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  // Add fallback for faster loading
  fallback: ['system-ui', 'sans-serif'],
});

// Enhanced cache with TTL and size limits
let cachedMetadata = null;
let metadataCacheTime = 0;
const METADATA_CACHE_TTL = 60000; // 1 minute

// Optimized metadata generation with caching
export async function generateMetadata() {
  // Check cache first
  if (cachedMetadata && Date.now() - metadataCacheTime < METADATA_CACHE_TTL) {
    return cachedMetadata;
  }

  try {
    // Fetch settings in parallel for better performance
    const [siteName, siteDescription] = await Promise.all([
      getSetting('siteName'),
      getSetting('siteDescription')
    ]);

    const metadata = {
      title: siteName || 'Mikias Building Materials',
      description: siteDescription || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
      // Add Open Graph tags for better SEO
      openGraph: {
        title: siteName || 'Mikias Building Materials',
        description: siteDescription || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
        type: 'website',
        locale: 'en_US',
        siteName: siteName || 'Mikias Building Materials',
        images: [
          {
            url: '/og-image.jpg',
            width: 1200,
            height: 630,
            alt: siteName || 'Mikias Building Materials',
          },
        ],
      },
      // Add Twitter card for better social sharing
      twitter: {
        card: 'summary_large_image',
        title: siteName || 'Mikias Building Materials',
        description: siteDescription || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
        images: ['/og-image.jpg'],
        creator: '@mikiasbuilding',
        site: '@mikiasbuilding',
      },
      // Add viewport meta for better mobile performance
      viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
      },
      // Add theme color for better mobile experience
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
      ],
      // Add robots meta for better SEO
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      // Add verification for search engines
      verification: {
        google: 'your-google-verification-code',
        yandex: 'your-yandex-verification-code',
      },
      // Add other metadata
      category: 'construction',
      keywords: ['building materials', 'hardware', 'sanitary', 'electrical', 'construction', 'Addis Ababa', 'Ethiopia'],
      authors: [{ name: 'Mikias Ayele Building Materials' }],
      creator: 'Mikias Ayele Building Materials',
      publisher: 'Mikias Ayele Building Materials',
      formatDetection: {
        telephone: true,
        date: false,
        address: false,
        email: true,
      },
    };

    // Cache the result
    cachedMetadata = metadata;
    metadataCacheTime = Date.now();

    return metadata;

  } catch (error) {
    console.error('Failed to generate metadata:', error);
    // Return fallback metadata
    return {
      title: 'Mikias Building Materials',
      description: 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
      viewport: 'width=device-width, initial-scale=1',
      robots: 'index, follow',
    };
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to external resources for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://unpkg.com" />
        {/* Add favicon fallback */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Add manifest for PWA support */}
        <link rel="manifest" href="/manifest.json" />
        {/* Add apple touch icon for iOS */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Preload critical assets */}
        <link rel="preload" href="/one.png" as="image" />
        <link rel="preload" href="/two.png" as="image" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Wrap providers in a fragment for better performance */}
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
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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
                  // Add loading toast style
                  loading: {
                    duration: 2000,
                    style: {
                      background: 'var(--color-card)',
                      color: 'var(--color-foreground)',
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