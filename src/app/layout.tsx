import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";
import { BottomBar } from "@/ui/BottomBar";
import { IntroOverlay } from "@/ui/IntroOverlay";
import { ListLink } from "@/ui/ListLink";
import { ResetView } from "@/ui/ResetView";
import { SheetCaption } from "@/ui/SheetCaption";
import { SpeechBubble } from "@/ui/SpeechBubble";
import { THEME_SCRIPT } from "@/ui/themeRule";
import { World } from "@/world/World";
import "./globals.css";

const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const display = Pixelify_Sans({ variable: "--font-display", subsets: ["latin"] });

const DESCRIPTION = "Aadit's portfolio: design, code, games and events, in a small pixel world.";

export const metadata: Metadata = {
  // Where the site lives, so the link preview picture gets a full address.
  metadataBase: new URL("https://aadit-portfolio-one.vercel.app"),
  title: { default: "Aadit · portfolio", template: "%s · Aadit" },
  description: DESCRIPTION,
  openGraph: { type: "website", siteName: "Aadit · portfolio", title: "Aadit · portfolio", description: DESCRIPTION },
  // A large picture card; the picture itself comes from opengraph-image.tsx.
  twitter: { card: "summary_large_image", title: "Aadit · portfolio", description: DESCRIPTION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-intro starts as "pending" so the page stays hidden until the world decides whether to play the opening.
    // data-theme is set by the head script before first paint, which is why hydration warnings are suppressed here.
    <html
      lang="en"
      data-intro="pending"
      data-theme="day"
      suppressHydrationWarning
      className={`${body.variable} ${mono.variable} ${display.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {/* The world and the bar read the URL, so they sit in Suspense and stay mounted between pages. */}
        <Suspense fallback={null}>
          <World />
        </Suspense>
        <SpeechBubble />
        <SheetCaption />
        <div className="content">{children}</div>
        <Suspense fallback={null}>
          <BottomBar />
        </Suspense>
        <ResetView />
        {/* These two read the URL as well. */}
        <Suspense fallback={null}>
          <ListLink />
          <IntroOverlay />
        </Suspense>
      </body>
    </html>
  );
}
