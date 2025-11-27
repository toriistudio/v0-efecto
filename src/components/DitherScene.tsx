"use client";

import { type ReactNode } from "react";

import type {
  DitherEffectSettings,
  ErrorDiffusionPattern,
  HexColor,
} from "@/components/DitherEffect";

type ControlValues = Record<string, any>;

const resolveNumber = (values: ControlValues, key: string, fallback: number) => {
  const value = values[key];
  return typeof value === "number" ? value : fallback;
};

const resolveString = (values: ControlValues, key: string, fallback: string) => {
  const value = values[key];
  return typeof value === "string" ? value : fallback;
};

export type DitherBaseProps = DitherEffectSettings;

export const buildDitherEffectProps = (
  values: ControlValues,
  baseProps: DitherBaseProps
): DitherEffectSettings => {
  const pattern = (values.pattern ?? baseProps.pattern) as ErrorDiffusionPattern;
  const color1 = resolveString(values.color1, "color1", baseProps.color1) as HexColor;
  const color2 = resolveString(values.color2, "color2", baseProps.color2) as HexColor;

  return {
    pattern,
    color1,
    color2,
    pixelation: resolveNumber(values, "pixelation", baseProps.pixelation),
    contrast: resolveNumber(values, "contrast", baseProps.contrast),
    brightness: resolveNumber(values, "brightness", baseProps.brightness),
    threshold: resolveNumber(values, "threshold", baseProps.threshold),
  };
};

export type DitherSceneSettings = DitherEffectSettings;

type DitherSceneProps = {
  children?: ReactNode;
};

export function DitherScene({ children }: DitherSceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 8]} intensity={1.2} />
      <pointLight position={[-4, -2, -6]} intensity={0.8} />
      {children}
    </>
  );
}
