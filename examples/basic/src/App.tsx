"use client";

import { Efecto } from "@toriistudio/v0-efecto";

const PRESET_POST = {
  scanlineIntensity: 0.3,
  scanlineCount: 300,
  targetFPS: 0,
  jitterIntensity: 0,
  jitterSpeed: 0,
  mouseGlowEnabled: false,
  mouseGlowRadius: 200,
  mouseGlowIntensity: 1.5,
  vignetteIntensity: 0.4,
  vignetteRadius: 0.7,
  colorPalette: "original",
  curvature: 0.15,
  aberrationStrength: 0,
  noiseIntensity: 0,
  noiseScale: 0.1,
  noiseSpeed: 0,
  waveAmplitude: 0,
  waveFrequency: 3,
  waveSpeed: 0.2,
  glitchIntensity: 0,
  glitchFrequency: 0,
  brightnessAdjust: 0.1,
  contrastAdjust: 1.2,
} as const;

export default function ExamplePage() {
  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "red" }}>
      <Efecto
        src="https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/astronaut_q84mbj.png"
        cellSize={4}
        invert={false}
        colorMode={true}
        style="standard"
        postProcessing={PRESET_POST}
      />
    </div>
  );
}
