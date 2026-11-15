"use client";

import { createContext, useContext } from "react";

/** False when the visitor has asked for reduced motion. */
export const MotionContext = createContext(true);
export const useMotion = () => useContext(MotionContext);
