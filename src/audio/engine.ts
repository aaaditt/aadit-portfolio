"use client";

import { BEATS_PER_BAR, TEMPO, bar, hz, type Mood, type Note } from "./music";
import type { Ambience } from "./mix";

/**
 * Everything the site plays, made in the browser with the Web Audio API: no sound files.
 * Nothing is created until the visitor turns sound on, because browsers only allow audio to
 * start from a click or key press.
 */

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  ambience: GainNode;
  river: GainNode;
  noise: AudioBuffer;
  analyser: AnalyserNode;
};

let graph: Graph | null = null;
let playing = false;
let timer = 0;
let stopTimer = 0;
let nextBarAt = 0;
let barIndex = 0;
let mood: Mood = "day";
let mix: Ambience = { river: 0, fire: 0, birds: 0, crickets: 0 };
/** Which foot the last step was on. */
let left = false;

/** How far ahead notes are scheduled, in seconds, and how often the scheduler wakes. */
const LOOKAHEAD = 0.3;
const TICK_MS = 25;

const moodNow = (): Mood => (document.documentElement.dataset.theme === "night" ? "night" : "day");

function gainNode(ctx: AudioContext, value: number, to: AudioNode | null) {
  const node = ctx.createGain();
  node.gain.value = value;
  if (to) node.connect(to);
  return node;
}

function build(): Graph {
  const ctx = new AudioContext();
  const master = gainNode(ctx, 0, null);
  // A gentle limiter, so many sounds at once never clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.ratio.value = 4;
  master.connect(limiter).connect(ctx.destination);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  limiter.connect(analyser);

  const music = gainNode(ctx, 0.34, master);
  // A soft echo on the music, so it sounds like it is drifting across the valley.
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.42;
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 1600;
  const feedback = gainNode(ctx, 0.3, echo);
  music.connect(echo);
  echo.connect(echoTone).connect(feedback);
  echoTone.connect(gainNode(ctx, 0.28, master));
  const sfx = gainNode(ctx, 0.55, master);
  const ambience = gainNode(ctx, 0.5, master);

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // The river: soft rushing noise, its tone drifting slowly so it never sounds like a hiss.
  const river = gainNode(ctx, 0, ambience);
  const flow = ctx.createBufferSource();
  flow.buffer = noise;
  flow.loop = true;
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 650;
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 140;
  flow.connect(high).connect(low).connect(river);
  flow.start();
  const drift = ctx.createOscillator();
  drift.frequency.value = 0.13;
  drift.connect(gainNode(ctx, 160, null)).connect(low.frequency);
  drift.start();

  return { ctx, master, music, sfx, ambience, river, noise, analyser };
}

/** An attack-hold-release volume shape on a gain node. */
function envelope(param: AudioParam, start: number, peak: number, attack: number, end: number, release: number) {
  param.setValueAtTime(0, start);
  param.linearRampToValueAtTime(peak, start + attack);
  param.setValueAtTime(peak, Math.max(start + attack, end - release));
  param.linearRampToValueAtTime(0, end);
}

function playNote(g: Graph, note: Note, start: number, beat: number) {
  const { ctx } = g;
  const length = note.length * beat;
  const end = start + length;
  const f = hz(note.midi);

  if (note.voice === "lead") {
    // A soft, breathy flute: a pure tone with a little warmth, a gentle swell and a slow vibrato.
    const amp = gainNode(ctx, 0, g.music);
    envelope(amp.gain, start, 0.12, Math.min(0.12, length * 0.25), end, Math.min(0.35, length * 0.35));
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 4.8;
    const depth = gainNode(ctx, 6, null);
    vibrato.connect(depth);
    for (const [type, level] of [
      ["sine", 1],
      ["triangle", 0.35],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      depth.connect(osc.detune);
      osc.connect(gainNode(ctx, level, amp));
      osc.start(start);
      osc.stop(end + 0.05);
    }
    vibrato.start(start);
    vibrato.stop(end + 0.05);
  } else if (note.voice === "bell") {
    // A soft bell: a pure tone and a faint overtone, ringing away.
    for (const [ratio, level] of [
      [1, 0.16],
      [2.01, 0.05],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = f * ratio;
      const amp = gainNode(ctx, 0, g.music);
      amp.gain.setValueAtTime(0, start);
      amp.gain.linearRampToValueAtTime(level, start + 0.008);
      amp.gain.exponentialRampToValueAtTime(0.0005, start + Math.max(1.4, length * 1.6));
      osc.connect(amp);
      osc.start(start);
      osc.stop(start + Math.max(1.5, length * 1.7));
    }
  } else if (note.voice === "bass") {
    // A round, soft bass: a pure tone with a little body, plucked then held quietly.
    const amp = gainNode(ctx, 0, g.music);
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(0.24, start + 0.03);
    amp.gain.setTargetAtTime(0.13, start + 0.03, 0.25);
    amp.gain.setTargetAtTime(0, end - 0.25, 0.08);
    for (const [type, level] of [
      ["sine", 1],
      ["triangle", 0.45],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      osc.connect(gainNode(ctx, level, amp));
      osc.start(start);
      osc.stop(end + 0.3);
    }
  } else {
    // The broken chord: each note plucked like a soft harp string and left to ring.
    const amp = gainNode(ctx, 0, g.music);
    const ring = Math.max(1.2, length * 1.4);
    amp.gain.setValueAtTime(0, start);
    amp.gain.linearRampToValueAtTime(0.085, start + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0005, start + ring);
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2600;
    tone.connect(amp);
    for (const [ratio, level] of [
      [1, 1],
      [2, 0.18],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f * ratio;
      osc.connect(gainNode(ctx, level, tone));
      osc.start(start);
      osc.stop(start + ring + 0.05);
    }
  }
}

/** A short burst of noise through a filter: footsteps, crackles, whooshes are all made from this. */
function noiseBurst(g: Graph, to: AudioNode, at: number, length: number, type: BiquadFilterType, frequency: number, level: number, q = 1) {
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  const filter = g.ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const amp = gainNode(g.ctx, 0, to);
  amp.gain.setValueAtTime(0, at);
  amp.gain.linearRampToValueAtTime(level, at + Math.min(0.005, length * 0.2));
  amp.gain.exponentialRampToValueAtTime(0.0005, at + length);
  src.connect(filter).connect(amp);
  src.start(at, Math.random() * 1.5);
  src.stop(at + length + 0.02);
  return filter;
}

function tone(g: Graph, to: AudioNode, at: number, from: number, toHz: number, glide: number, length: number, level: number, type: OscillatorType = "sine") {
  const osc = g.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(toHz, at + glide);
  const amp = gainNode(g.ctx, 0, to);
  amp.gain.setValueAtTime(0, at);
  amp.gain.linearRampToValueAtTime(level, at + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0005, at + length);
  osc.connect(amp);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

function panned(g: Graph, pan: number) {
  const panner = g.ctx.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(g.ambience);
  return panner;
}

/** Wakes every few milliseconds: queues the next bars of music and the odd bird or crackle. */
function tick() {
  const g = graph;
  if (!g || !playing) return;
  const now = g.ctx.currentTime;
  while (nextBarAt < now + LOOKAHEAD) {
    // The music only changes between day and night at the start of a phrase.
    if (barIndex % 4 === 0) mood = moodNow();
    const beat = 60 / TEMPO[mood];
    for (const note of bar(barIndex, mood)) playNote(g, note, nextBarAt + note.at * beat, beat);
    nextBarAt += BEATS_PER_BAR * beat;
    barIndex++;
  }

  const dt = TICK_MS / 1000;
  const at = now + 0.05;
  if (Math.random() < (mix.birds * dt) / 3) {
    // A bird: two to four quick rising chirps, somewhere off to one side.
    const side = panned(g, Math.random() * 1.4 - 0.7);
    const pitch = 2400 + Math.random() * 900;
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) tone(g, side, at + i * 0.11, pitch, pitch * 1.5, 0.07, 0.09, 0.05);
  }
  if (Math.random() < (mix.crickets * dt) / 0.9) {
    const side = panned(g, Math.random() * 1.6 - 0.8);
    for (let i = 0; i < 3; i++) tone(g, side, at + i * 0.045, 4600, 4700, 0.02, 0.03, 0.022);
  }
  if (Math.random() < mix.fire * dt * 9) noiseBurst(g, g.ambience, at, 0.015 + Math.random() * 0.02, "highpass", 1800, 0.05 + Math.random() * 0.07);
}

export const engine = {
  get on() {
    return playing;
  },

  /** Starts (or resumes) everything. Call from a click or key press. */
  start() {
    graph ??= build();
    const g = graph;
    window.clearTimeout(stopTimer);
    void g.ctx.resume();
    g.master.gain.cancelScheduledValues(g.ctx.currentTime);
    g.master.gain.setTargetAtTime(1, g.ctx.currentTime, 0.3);
    if (!playing) {
      playing = true;
      nextBarAt = g.ctx.currentTime + 0.15;
      barIndex = 0;
      mood = moodNow();
      timer = window.setInterval(tick, TICK_MS);
    }
  },

  /** Fades everything out and puts the audio to sleep. */
  stop() {
    const g = graph;
    playing = false;
    window.clearInterval(timer);
    if (!g) return;
    g.master.gain.cancelScheduledValues(g.ctx.currentTime);
    g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.1);
    stopTimer = window.setTimeout(() => void g.ctx.suspend(), 500);
  },

  /** While the tab is hidden, nothing plays. */
  pause(hidden: boolean) {
    if (!graph || !playing) return;
    if (hidden) void graph.ctx.suspend();
    else void graph.ctx.resume();
  },

  setAmbience(next: Ambience) {
    mix = next;
    if (graph && playing) graph.river.gain.setTargetAtTime(next.river * 0.32, graph.ctx.currentTime, 0.4);
  },

  /** How loud the output is right now, from 0 to 1. For checking that sound is really playing. */
  level() {
    if (!graph) return 0;
    const data = new Uint8Array(graph.analyser.fftSize);
    graph.analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
    return peak;
  },
};

/** Sound effects. Each does nothing while sound is off. */
export const sfx = {
  /** A soft blip, for picking something in the bar or the world. */
  click() {
    const g = graph;
    if (!g || !playing) return;
    tone(g, g.sfx, g.ctx.currentTime, 1300, 700, 0.05, 0.08, 0.09, "square");
  },
  /** One footstep: a low, soft "dhoom", the feet taking turns a touch higher and lower. */
  step() {
    const g = graph;
    if (!g || !playing) return;
    const now = g.ctx.currentTime;
    left = !left;
    const pitch = (left ? 92 : 80) + Math.random() * 6;
    tone(g, g.sfx, now, pitch, pitch * 0.55, 0.12, 0.2, 0.32);
    noiseBurst(g, g.sfx, now, 0.06, "lowpass", 260, 0.1);
  },
  /** A rising three-note chime: he has arrived. */
  chime() {
    const g = graph;
    if (!g || !playing) return;
    const now = g.ctx.currentTime;
    [1318.5, 1568, 2093].forEach((f, i) => tone(g, g.sfx, now + i * 0.09, f, f, 0.01, 0.75, 0.07));
  },
  /** Wind rushing past as the camera swoops down in the opening. */
  whoosh(seconds = 3.5) {
    const g = graph;
    if (!g || !playing) return;
    const now = g.ctx.currentTime;
    const src = g.ctx.createBufferSource();
    src.buffer = g.noise;
    src.loop = true;
    const filter = g.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + seconds * 0.45);
    filter.frequency.exponentialRampToValueAtTime(350, now + seconds);
    const amp = gainNode(g.ctx, 0, g.sfx);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(0.22, now + seconds * 0.45);
    amp.gain.linearRampToValueAtTime(0, now + seconds);
    src.connect(filter).connect(amp);
    src.start(now);
    src.stop(now + seconds + 0.05);
  },
  /** A block landing as the valley rises out of the lake. */
  thunk() {
    const g = graph;
    if (!g || !playing) return;
    const now = g.ctx.currentTime;
    const pitch = 120 + Math.random() * 50;
    tone(g, g.sfx, now, pitch, 45, 0.16, 0.22, 0.22);
    noiseBurst(g, g.sfx, now, 0.05, "lowpass", 400, 0.12);
  },
};
