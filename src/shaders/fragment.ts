export default `
  uniform float cellSize;
  uniform bool invert;
  uniform bool colorMode;
  uniform int asciiStyle;
  
  // PostFX uniforms
  uniform float time;
  uniform vec2 resolution;
  uniform vec2 mousePos;
  
  // Tier 1 uniforms
  uniform float scanlineIntensity;
  uniform float scanlineCount;
  uniform float targetFPS;
  uniform float jitterIntensity;
  uniform float jitterSpeed;
  uniform bool mouseGlowEnabled;
  uniform float mouseGlowRadius;
  uniform float mouseGlowIntensity;
  uniform float vignetteIntensity;
  uniform float vignetteRadius;
  uniform int colorPalette;
  
  // Tier 2 uniforms
  uniform float curvature;
  uniform float aberrationStrength;
  uniform float noiseIntensity;
  uniform float noiseScale;
  uniform float noiseSpeed;
  uniform float waveAmplitude;
  uniform float waveFrequency;
  uniform float waveSpeed;
  uniform float glitchIntensity;
  uniform float glitchFrequency;
  uniform float brightnessAdjust;
  uniform float contrastAdjust;
  
  // =======================
  // HELPER FUNCTIONS
  // =======================
  
  // Pseudo-random function
  float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // 2D Noise function
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  // RGB to HSL conversion
  vec3 rgb2hsl(vec3 rgb) {
    float maxVal = max(max(rgb.r, rgb.g), rgb.b);
    float minVal = min(min(rgb.r, rgb.g), rgb.b);
    float delta = maxVal - minVal;
  
    float h = 0.0;
    float s = 0.0;
    float l = (maxVal + minVal) * 0.5;
  
    if (delta > 0.0001) {
      s = delta / (1.0 - abs(2.0 * l - 1.0));
  
      if (maxVal == rgb.r) {
        h = mod((rgb.g - rgb.b) / delta, 6.0);
      } else if (maxVal == rgb.g) {
        h = (rgb.b - rgb.r) / delta + 2.0;
      } else {
        h = (rgb.r - rgb.g) / delta + 4.0;
      }
      h = h / 6.0;
    }
  
    return vec3(h, s, l);
  }
  
  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
  
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
  
    vec3 rgb = vec3(0.0);
  
    if (h < 1.0/6.0) {
      rgb = vec3(c, x, 0.0);
    } else if (h < 2.0/6.0) {
      rgb = vec3(x, c, 0.0);
    } else if (h < 3.0/6.0) {
      rgb = vec3(0.0, c, x);
    } else if (h < 4.0/6.0) {
      rgb = vec3(0.0, x, c);
    } else if (h < 5.0/6.0) {
      rgb = vec3(x, 0.0, c);
    } else {
      rgb = vec3(c, 0.0, x);
    }
  
    return rgb + m;
  }
  
  // Apply color palette
  vec3 applyColorPalette(vec3 color, float brightness, int palette) {
    if (palette == 0) return color; // Original
  
    vec3 paletteColor = color;
  
    if (palette == 1) { // Green phosphor
      paletteColor = vec3(0.0, brightness, 0.0) * 1.5;
    } else if (palette == 2) { // Amber
      paletteColor = vec3(brightness * 1.2, brightness * 0.7, 0.0);
    } else if (palette == 3) { // Cyan
      paletteColor = vec3(0.0, brightness * 0.9, brightness);
    } else if (palette == 4) { // Blue
      paletteColor = vec3(0.0, 0.0, brightness);
    }
  
    return paletteColor;
  }
  
  // Different character patterns based on style
  float getChar(float brightness, vec2 p, int style) {
    vec2 grid = floor(p * 4.0);
    float val = 0.0;
  
    if (style == 0) {
      // Standard ASCII style
      if (brightness < 0.2) {
        val = (grid.x == 1.0 && grid.y == 1.0) ? 0.3 : 0.0;
      } else if (brightness < 0.35) {
        val = (grid.x == 1.0 || grid.x == 2.0) && (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
      } else if (brightness < 0.5) {
        val = (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
      } else if (brightness < 0.65) {
        val = (grid.y == 0.0 || grid.y == 3.0) ? 1.0 : (grid.y == 1.0 || grid.y == 2.0) ? 0.5 : 0.0;
      } else if (brightness < 0.8) {
        val = (grid.x == 0.0 || grid.x == 2.0 || grid.y == 0.0 || grid.y == 2.0) ? 1.0 : 0.3;
      } else {
        val = 1.0;
      }
    } else if (style == 1) {
      // Dense style
      if (brightness < 0.15) {
        val = 0.0;
      } else if (brightness < 0.3) {
        val = (grid.x >= 1.0 && grid.x <= 2.0 && grid.y >= 1.0 && grid.y <= 2.0) ? 0.6 : 0.0;
      } else if (brightness < 0.5) {
        val = (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.3;
      } else if (brightness < 0.7) {
        val = (grid.x == 0.0 || grid.x == 3.0 || grid.y == 0.0 || grid.y == 3.0) ? 1.0 : 0.6;
      } else {
        val = 1.0;
      }
    } else if (style == 2) {
      // Minimal style
      if (brightness < 0.25) {
        val = 0.0;
      } else if (brightness < 0.4) {
        val = (grid.x == 2.0 && grid.y == 2.0) ? 1.0 : 0.0;
      } else if (brightness < 0.6) {
        val = (grid.x == 1.0 || grid.x == 2.0) && grid.y == 2.0 ? 1.0 : 0.0;
      } else if (brightness < 0.8) {
        val = (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
      } else {
        val = (grid.x <= 2.0 && grid.y <= 2.0) ? 1.0 : 0.3;
      }
    } else if (style == 3) {
      // Blocks style
      if (brightness < 0.2) {
        val = 0.0;
      } else if (brightness < 0.4) {
        val = (grid.x >= 1.0 && grid.x <= 2.0 && grid.y >= 1.0 && grid.y <= 2.0) ? 0.8 : 0.0;
      } else if (brightness < 0.6) {
        val = (grid.y <= 2.0) ? 0.9 : 0.0;
      } else if (brightness < 0.8) {
        val = (grid.x <= 2.0 || grid.y <= 2.0) ? 1.0 : 0.2;
      } else {
        val = 1.0;
      }
    }
  
    return val;
  }
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 workingUV = uv;
  
    // ===========================
    // TIER 2: PRE-PROCESSING
    // ===========================
  
    // Screen curvature
    if (curvature > 0.0) {
      vec2 centered = workingUV * 2.0 - 1.0;
      float dist = dot(centered, centered);
      centered *= 1.0 + curvature * dist;
      workingUV = centered * 0.5 + 0.5;
  
      // Black out edges if out of bounds
      if (workingUV.x < 0.0 || workingUV.x > 1.0 || workingUV.y < 0.0 || workingUV.y > 1.0) {
        outputColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
    }
  
    // Wave distortion
    if (waveAmplitude > 0.0) {
      workingUV.x += sin(workingUV.y * waveFrequency + time * waveSpeed) * waveAmplitude;
      workingUV.y += cos(workingUV.x * waveFrequency + time * waveSpeed) * waveAmplitude * 0.5;
    }
  
    // ===========================
    // CORE ASCII RENDERING
    // ===========================
  
    vec2 res = resolution;
    vec2 cellCount = res / cellSize;
    vec2 cellCoord = floor(workingUV * cellCount);
  
    // Frame rate control
    if (targetFPS > 0.0) {
      float frameTime = 1.0 / targetFPS;
      float frameIndex = floor(time / frameTime);
      cellCoord = floor(workingUV * cellCount) + vec2(random(vec2(frameIndex)) * 0.5);
    }
  
    vec2 cellUV = (cellCoord + 0.5) / cellCount;
  
    // Chromatic aberration
    vec4 cellColor;
    if (aberrationStrength > 0.0) {
      float r = texture(inputBuffer, cellUV + vec2(aberrationStrength, 0.0)).r;
      float g = texture(inputBuffer, cellUV).g;
      float b = texture(inputBuffer, cellUV - vec2(aberrationStrength, 0.0)).b;
      cellColor = vec4(r, g, b, 1.0);
    } else {
      cellColor = texture(inputBuffer, cellUV);
    }
  
    // Calculate brightness
    float brightness = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
  
    // Contrast and brightness adjustment
    brightness = (brightness - 0.5) * contrastAdjust + 0.5 + brightnessAdjust;
    brightness = clamp(brightness, 0.0, 1.0);
  
    // Time-based noise
    if (noiseIntensity > 0.0) {
      float noiseVal = noise(workingUV * noiseScale * 100.0 + time * noiseSpeed);
      brightness = mix(brightness, noiseVal, noiseIntensity);
    }
  
    // Jitter/fuzzy effect
    if (jitterIntensity > 0.0) {
      float jitter = random(cellCoord + floor(time * jitterSpeed) * 0.1) - 0.5;
      brightness += jitter * jitterIntensity;
      brightness = clamp(brightness, 0.0, 1.0);
    }
  
    // RGB Glitch
    if (glitchIntensity > 0.0 && glitchFrequency > 0.0) {
      float glitchTrigger = random(vec2(time * glitchFrequency));
      if (glitchTrigger > 0.9) {
        float glitchOffset = (random(cellCoord + time) - 0.5) * glitchIntensity;
        cellColor.r = texture(inputBuffer, cellUV + vec2(glitchOffset, 0.0)).r;
        cellColor.b = texture(inputBuffer, cellUV - vec2(glitchOffset, 0.0)).b;
      }
    }
  
    if (invert) {
      brightness = 1.0 - brightness;
    }
  
    // Get local UV within the cell
    vec2 localUV = fract(workingUV * cellCount);
    float charValue = getChar(brightness, localUV, asciiStyle);
  
    // ===========================
    // TIER 1: POST-PROCESSING
    // ===========================
  
    vec3 finalColor;
  
    if (colorMode) {
      finalColor = cellColor.rgb * charValue;
    } else {
      finalColor = vec3(brightness * charValue);
    }
  
    // Color palette
    finalColor = applyColorPalette(finalColor, brightness, colorPalette);
  
    // Mouse glow
    if (mouseGlowEnabled && mouseGlowRadius > 0.0) {
      vec2 pixelPos = workingUV * res;
      float dist = distance(pixelPos, mousePos);
      float glow = 1.0 - smoothstep(0.0, mouseGlowRadius, dist);
      glow = pow(glow, 2.0);
      finalColor *= 1.0 + glow * mouseGlowIntensity;
    }
  
    // Scanlines
    if (scanlineIntensity > 0.0) {
      float scanline = sin(workingUV.y * scanlineCount * 3.14159) * 0.5 + 0.5;
      finalColor *= 1.0 - scanlineIntensity * (1.0 - scanline);
    }
  
    // Vignette
    if (vignetteIntensity > 0.0) {
      vec2 centered = workingUV - 0.5;
      float dist = length(centered) / 0.707; // Normalize to corner distance
      float vignette = smoothstep(vignetteRadius, vignetteRadius - 0.5, dist);
      finalColor *= mix(1.0, vignette, vignetteIntensity);
    }
  
    outputColor = vec4(finalColor, cellColor.a);
  }
`;
