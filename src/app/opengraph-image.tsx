import { ImageResponse } from "next/og";
import { LETTERS } from "@/ui/pixelArt";

/** The picture shown when the site's link is pasted into a chat, a post or a message. */
export const alt = "Aadit's portfolio: a small pixel world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAME = "AADIT";
/** One pixel of the name, in image pixels. */
const PX = 24;
const INK = "#27374d";

/** Blocky hills along the bottom: [left, width, height, colour], back row first. */
const HILLS: [number, number, number, string][] = [
  [0, 260, 100, "#7fb069"],
  [200, 300, 140, "#6aa35a"],
  [470, 240, 90, "#7fb069"],
  [680, 320, 130, "#6aa35a"],
  [960, 240, 95, "#7fb069"],
  [0, 1200, 60, "#9bbf4f"],
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          background: "linear-gradient(to bottom, #5fb4ee 0%, #a9dcf7 55%, #eef0dc 85%)",
        }}
      >
        {/* A square sun, top right. */}
        <div style={{ position: "absolute", top: 48, right: 64, width: 84, height: 84, background: "#ffd27a", display: "flex" }} />

        {HILLS.map(([left, width, height, colour], i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left, width, height, background: colour, display: "flex" }} />
        ))}

        <div style={{ display: "flex", marginTop: 92, fontSize: 30, letterSpacing: 8, color: INK }}>PORTFOLIO</div>

        {/* The name, built from the same pixel letters as the home page. */}
        <div style={{ display: "flex", marginTop: 28 }}>
          {[...NAME].map((letter, n) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", marginLeft: n === 0 ? 0 : PX * 1.5 }}>
              {LETTERS[letter].map((row, r) => (
                <div key={r} style={{ display: "flex" }}>
                  {[...row].map((cell, c) => (
                    <div key={c} style={{ width: PX, height: PX, background: cell === "#" ? INK : "transparent", display: "flex" }} />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", marginTop: 36, fontSize: 38, color: INK }}>Design, code and events, in a small pixel world.</div>
      </div>
    ),
    size,
  );
}
