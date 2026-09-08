import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FURQAN — কুরআন পড়ো না, বোঝো",
  description: "কুরআন ও হাদিসের আলোয় জীবনকে বোঝো",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Serif+Bengali:wght@500;600;700&family=Marcellus&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Furqan" />
        <meta name="theme-color" content="#1F7A4C" />
      </head>
      <body>{children}</body>
    </html>
  );
}
