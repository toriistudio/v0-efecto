export const MEDIA_ADJUST_VERTEX_SHADER = `
  uniform vec2 uvScale;
  uniform vec2 uvOffset;
  varying vec2 vUv;

  void main() {
    // Apply texture scale and offset for cover-fill effect
    vUv = uv * uvScale + uvOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const MEDIA_ADJUST_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform float brightness;
  uniform float contrast;
  uniform float saturation;
  varying vec2 vUv;

  vec3 adjustContrast(vec3 color, float contrastAmount) {
    return (color - 0.5) * contrastAmount + 0.5;
  }

  vec3 adjustSaturation(vec3 color, float saturationAmount) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(gray), color, saturationAmount);
  }

  void main() {
    vec4 texel = texture2D(map, vUv);
    vec3 color = texel.rgb;

    // Apply brightness
    color *= brightness;

    // Apply contrast
    color = adjustContrast(color, contrast);

    // Apply saturation
    color = adjustSaturation(color, saturation);

    gl_FragColor = vec4(color, texel.a);
  }
`;
