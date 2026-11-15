import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist_Mono, Pixelify_Sans, Space_Grotesk } from "next/font/google";
import { BottomBar } from "@/ui/BottomBar";
import { IntroOverlay } from "@/ui/IntroOverlay";
import { SpeechBubble } from "@/ui/SpeechBubble";
import { World } from "@/world/World";
import "./globals.css";

const body = Space_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const display = Pixelify_Sans({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Aadit · portfolio", template: "%s · Aadit" },
  description: "Aadit's portfolio: design, code, games and events, in a small pixel world.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-intro starts as "pending" so the page stays hidden until the world decides whether to play the opening.
    <html lang="en" data-intro="pending" className={`${body.variable} ${mono.variable} ${display.variable}`}>
      <body>
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {/* The world and the bar read the URL, so they sit in Suspense and stay mounted between pages. */}
        <Suspense fallback={null}>
          <World />
        </Suspense>
        <SpeechBubble />
        <div className="content">{children}</div>
        <Suspense fallback={null}>
          <BottomBar />
        </Suspense>
        <IntroOverlay />
      </body>
    </html>
  );
}
