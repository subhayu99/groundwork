import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "./MotionProvider";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";

// The deploy's base path ("/groundwork" on Pages, "" locally). PWA asset links
// must include it explicitly — Next does not prefix metadata/manifest URLs.
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Groundwork — algorithms from first principles",
  description:
    "Learn data structures and algorithms from first principles, not patterns. Built to be followed by anyone, including people with zero computer-science background.",
  applicationName: "Groundwork",
  appleWebApp: {
    capable: true,
    title: "Groundwork",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#111419" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* PWA tags. React 19 hoists link/meta to <head>; hrefs carry the base
            path explicitly so they resolve under /groundwork on Pages. */}
        <link rel="manifest" href={`${BP}/manifest.webmanifest`} />
        <link rel="apple-touch-icon" href={`${BP}/icons/apple-icon-180.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${BP}/icons/icon-192.png`} />
        <MotionProvider>{children}</MotionProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
