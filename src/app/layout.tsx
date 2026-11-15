import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { BottomBar } from "@/ui/BottomBar";
import { World } from "@/world/World";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Aadit · portfolio", template: "%s · Aadit" },
  description: "Aadit's portfolio: design, code, games and events, on a small 3D island.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable}`}>
      <body>
        {/* The island and the bar read the URL, so they sit in Suspense and stay mounted between pages. */}
        <Suspense fallback={null}>
          <World />
        </Suspense>
        <div className="content">{children}</div>
        <Suspense fallback={null}>
          <BottomBar />
        </Suspense>
      </body>
    </html>
  );
}
