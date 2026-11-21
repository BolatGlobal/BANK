import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AegisRails — Bank Defense Command Center",
  description: "A unified command center for banking API runtime defense and data security posture management. Interactive demonstration with synthetic telemetry.",
  appleWebApp: { capable: true, title: "AegisRails", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1014" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" /></head><body>{children}</body></html>;
}
