import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marquee — Title-Level Cinema & TV Tracker",
  description: "An intentional, craft-driven entertainment tracker for cinema and television with zero bloat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0A0B0D] text-[#F3F4F6] selection:bg-white/20 selection:text-white">
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
