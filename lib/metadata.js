// lib/metadata.js - Shared metadata configuration
export const defaultViewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const defaultThemeColor = {
  light: '#ffffff',
  dark: '#0f172a',
};

export function createMetadata(options = {}) {
  return {
    title: options.title || 'Mikias Building Materials',
    description: options.description || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
    openGraph: options.openGraph || {
      title: options.title || 'Mikias Building Materials',
      description: options.description || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
      type: 'website',
      locale: 'en_US',
    },
    twitter: options.twitter || {
      card: 'summary_large_image',
      title: options.title || 'Mikias Building Materials',
      description: options.description || 'Quality Building Materials, Hardware, Sanitary & Electrical Supplies in Addis Ababa',
    },
    ...options,
  };
}