export type MoodId = "daylight" | "arcade" | "blueprint";

export type Mood = {
  id: MoodId;
  /** Shown on the page. */
  name: string;
  /** One line describing the feel. */
  tagline: string;
  palette: {
    sky: string;
    ground: string;
    primary: string;
    secondary: string;
    accent: string;
    character: string;
    text: string;
  };
  light: {
    ambient: number;
    sun: number;
    sunColor: string;
    sunPosition: [number, number, number];
    shadows: boolean;
  };
  fog: { color: string; near: number; far: number } | null;
  /** Shape language for buildings and props. */
  shape: "rounded" | "sharp" | "wire";
  /** Surface treatment. */
  material: "soft" | "glow" | "line";
  /** Bloom strength; 0 turns it off. */
  bloom: number;
};

export const MOODS: Mood[] = [
  {
    id: "daylight",
    name: "Paper Daylight",
    tagline: "Warm, soft and friendly, like a model made of card on a sunny desk.",
    palette: {
      sky: "#f6e7d2",
      ground: "#a8d5a2",
      primary: "#f4a261",
      secondary: "#e76f51",
      accent: "#2a9d8f",
      character: "#264653",
      text: "#3d2c2e",
    },
    light: {
      ambient: 0.9,
      sun: 2.4,
      sunColor: "#fff1d6",
      sunPosition: [6, 9, 4],
      shadows: true,
    },
    fog: { color: "#f6e7d2", near: 16, far: 38 },
    shape: "rounded",
    material: "soft",
    bloom: 0,
  },
  {
    id: "arcade",
    name: "Night Arcade",
    tagline: "Dark and electric, with neon edges that glow like a late-night game hall.",
    palette: {
      sky: "#07060f",
      ground: "#14112b",
      primary: "#ff2e88",
      secondary: "#21e6ff",
      accent: "#ffe45c",
      character: "#b56bff",
      text: "#f4f0ff",
    },
    light: {
      ambient: 0.35,
      sun: 0.6,
      sunColor: "#8a7dff",
      sunPosition: [-5, 8, 6],
      shadows: false,
    },
    fog: { color: "#07060f", near: 12, far: 30 },
    shape: "sharp",
    material: "glow",
    bloom: 1.1,
  },
  {
    id: "blueprint",
    name: "Blueprint",
    tagline: "Calm and technical, a world drawn in pale lines on deep ink blue.",
    palette: {
      sky: "#0b2545",
      ground: "#13315c",
      primary: "#e8f1ff",
      secondary: "#8da9c4",
      accent: "#ffb703",
      character: "#ffffff",
      text: "#e8f1ff",
    },
    light: {
      ambient: 1.2,
      sun: 0.8,
      sunColor: "#ffffff",
      sunPosition: [4, 10, 6],
      shadows: false,
    },
    fog: null,
    shape: "wire",
    material: "line",
    bloom: 0,
  },
];

export function getMood(id: string): Mood | undefined {
  return MOODS.find((m) => m.id === id);
}
