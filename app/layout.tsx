import type { Metadata } from "next";
import { AppMenu } from "@/components/app-menu";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mil-range-finder.local"),
  title: {
    default: "Slingshot Range Finder",
    template: "%s | Slingshot Range Finder",
  },
  description: "Offline-capable MIL distance calculator for quick field target estimates.",
  applicationName: "Slingshot Range Finder",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Slingshot Range Finder",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PwaRegistration />
        <AppMenu />
        {children}
      </body>
    </html>
  );
}
