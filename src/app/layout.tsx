import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Mirar — Title-Level Cinema & TV Tracker",
  description: "An intentional, craft-driven entertainment tracker for cinema and television with zero bloat.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mirar",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased overflow-x-hidden">
      <body className="min-h-full flex flex-col bg-[#0A0B0D] text-[#F3F4F6] selection:bg-white/20 selection:text-white overflow-x-hidden w-full max-w-full">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#14161B",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#F3F4F6",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
