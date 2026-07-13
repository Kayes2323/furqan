import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./lib/theme";

export const metadata: Metadata = {
  title: "FURQAN — কুরআন পড়ো না, বোঝো",
  description: "কুরআন ও হাদিসের আলোয় জীবনকে বোঝো",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}