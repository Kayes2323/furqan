import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "./lib/theme";
import PWAInstaller from "./components/PWAInstaller";

export const viewport: Viewport = {
  themeColor: '#1A5F7A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FURQAN — কুরআন পড়ো না, বোঝো",
  description: "কুরআন ও হাদিসের আলোয় জীবনকে বোঝো",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FURQAN",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider>
          <PWAInstaller />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}