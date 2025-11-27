"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

const DEFAULT_COLORS = {
  color1: "#050505",
  color2: "#fafafa",
} as const;

const DEFAULT_DITHER_SETTINGS = {
  pattern: "floydSteinberg",
  color1: DEFAULT_COLORS.color1,
  color2: DEFAULT_COLORS.color2,
  pixelation: 2,
  contrast: 1,
  brightness: 1,
  threshold: 1,
} as const satisfies Required<DitherEffectSettings>;

const ERROR_DIFFUSION_PATTERNS = {
  floydSteinberg: {
    kernel: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
    divisor: 16,
  },
  jarvisJudiceNinke: {
    kernel: [
      [1, 0, 7],
      [2, 0, 5],
      [-2, 1, 3],
      [-1, 1, 5],
      [0, 1, 7],
      [1, 1, 5],
      [2, 1, 3],
      [-2, 2, 1],
      [-1, 2, 3],
      [0, 2, 5],
      [1, 2, 3],
      [2, 2, 1],
    ],
    divisor: 48,
  },
  stucki: {
    kernel: [
      [1, 0, 8],
      [2, 0, 4],
      [-2, 1, 2],
      [-1, 1, 4],
      [0, 1, 8],
      [1, 1, 4],
      [2, 1, 2],
      [-2, 2, 1],
      [-1, 2, 2],
      [0, 2, 4],
      [1, 2, 2],
      [2, 2, 1],
    ],
    divisor: 42,
  },
  atkinson: {
    kernel: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
    divisor: 8,
  },
  burkes: {
    kernel: [
      [1, 0, 8],
      [2, 0, 4],
      [-2, 1, 2],
      [-1, 1, 4],
      [0, 1, 8],
      [1, 1, 4],
      [2, 1, 2],
    ],
    divisor: 32,
  },
  sierra: {
    kernel: [
      [1, 0, 5],
      [2, 0, 3],
      [-2, 1, 2],
      [-1, 1, 4],
      [0, 1, 5],
      [1, 1, 4],
      [2, 1, 2],
      [-1, 2, 2],
      [0, 2, 3],
      [1, 2, 2],
    ],
    divisor: 32,
  },
  twoRowSierra: {
    kernel: [
      [1, 0, 4],
      [2, 0, 3],
      [-2, 1, 1],
      [-1, 1, 2],
      [0, 1, 3],
      [1, 1, 2],
      [2, 1, 1],
    ],
    divisor: 16,
  },
  sierraLite: {
    kernel: [
      [1, 0, 2],
      [-1, 1, 1],
      [0, 1, 1],
    ],
    divisor: 4,
  },
} as const;

type KernelEntry = readonly [number, number, number];
export type ErrorDiffusionPattern = keyof typeof ERROR_DIFFUSION_PATTERNS;

export type HexColor = `#${string}`;

export type DitherEffectSettings = {
  pattern: ErrorDiffusionPattern;
  color1: HexColor;
  color2: HexColor;
  pixelation: number;
  contrast: number;
  brightness: number;
  threshold: number;
};

type CanvasSource = HTMLCanvasElement | OffscreenCanvas;

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

const parseHexColor = (value: string): [number, number, number] => {
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
  if (!hexMatch) {
    return [0, 0, 0];
  }
  return [
    parseInt(hexMatch[1], 16) / 255,
    parseInt(hexMatch[2], 16) / 255,
    parseInt(hexMatch[3], 16) / 255,
  ];
};

const findClosestPaletteColor = (
  r: number,
  g: number,
  b: number,
  palette: Array<[number, number, number]>
): [number, number, number] => {
  let minDistance = Infinity;
  let result = palette[0];
  for (const color of palette) {
    const dr = r - color[0];
    const dg = g - color[1];
    const db = b - color[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < minDistance) {
      minDistance = distance;
      result = color;
    }
  }
  return result;
};

const GPU_TEXTURE_USAGE = {
  TEXTURE_BINDING: 0x04,
  COPY_DST: 0x02,
  RENDER_ATTACHMENT: 0x10,
};

class DitherRenderer {
  private outputCanvas: HTMLCanvasElement;
  private gpuContext: any = null;
  private device: any = null;
  private pipeline: any = null;
  private sampler: any = null;
  private sourceTexture: any = null;
  private lastWidth = 0;
  private lastHeight = 0;
  private tempCanvas: HTMLCanvasElement | null = null;
  private tempContext: CanvasRenderingContext2D | null = null;
  private lastFrameTime = 0;
  private fallbackContext: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.outputCanvas = canvas;
    this.fallbackContext = canvas.getContext("2d");
  }

  async initializeGPU() {
    const gpuNavigator = navigator as Navigator & { gpu?: any };
    const gpu = gpuNavigator.gpu;
    if (!gpu) {
      return;
    }
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return;
    }
    const device = await adapter.requestDevice();
    const context = this.outputCanvas.getContext("webgpu") as any;
    if (!context) {
      return;
    }
    const format = gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: "premultiplied",
    });
    this.device = device;
    this.gpuContext = context;
    this.createPipeline(format);
  }

  private createPipeline(format: any) {
    if (!this.device) {
      return;
    }

    const shaderCode = `
      struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) uv : vec2f,
      };

      @vertex
      fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
        var output : VertexOutput;

        var positions = array<vec2f, 3>(
          vec2f(-1.0, -1.0),
          vec2f(3.0, -1.0),
          vec2f(-1.0, 3.0)
        );

        var uvs = array<vec2f, 3>(
          vec2f(0.0, 1.0),
          vec2f(2.0, 1.0),
          vec2f(0.0, -1.0)
        );

        output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
        output.uv = uvs[vertexIndex];
        return output;
      }

      @group(0) @binding(0) var inputTexture : texture_2d<f32>;
      @group(0) @binding(1) var inputSampler : sampler;

      @fragment
      fn fragmentMain(input : VertexOutput) -> @location(0) vec4f {
        return textureSample(inputTexture, inputSampler, input.uv);
      }
    `;

    const shaderModule = this.device.createShaderModule({ code: shaderCode });
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });
  }

  private ensureSourceTexture(width: number, height: number) {
    if (!this.device) {
      return;
    }
    if (
      this.sourceTexture &&
      this.lastWidth === width &&
      this.lastHeight === height
    ) {
      return;
    }
    this.sourceTexture?.destroy();
    this.sourceTexture = this.device.createTexture({
      size: [width, height],
      format: "rgba8unorm",
      usage:
        GPU_TEXTURE_USAGE.TEXTURE_BINDING |
        GPU_TEXTURE_USAGE.COPY_DST |
        GPU_TEXTURE_USAGE.RENDER_ATTACHMENT,
    });
    this.lastWidth = width;
    this.lastHeight = height;
  }

  private applyErrorDiffusion(
    source: CanvasSource,
    settings: DitherEffectSettings
  ): HTMLCanvasElement | CanvasSource {
    const currentTime = Date.now();
    if (currentTime - this.lastFrameTime < 50) {
      return this.tempCanvas ?? source;
    }
    this.lastFrameTime = currentTime;

    if (!this.tempCanvas) {
      this.tempCanvas = document.createElement("canvas");
      this.tempContext = this.tempCanvas.getContext("2d", {
        willReadFrequently: true,
      });
    }

    const width = source.width;
    const height = source.height;
    if (!width || !height || !this.tempCanvas || !this.tempContext) {
      return source;
    }

    this.tempCanvas.width = width;
    this.tempCanvas.height = height;

    try {
      this.tempContext.drawImage(source as CanvasImageSource, 0, 0);
    } catch {
      return source;
    }

    let imageData: ImageData;
    try {
      imageData = this.tempContext.getImageData(0, 0, width, height);
    } catch {
      return source;
    }

    const data = imageData.data;
    if (data.length === 0) {
      return source;
    }

    const pattern = ERROR_DIFFUSION_PATTERNS[settings.pattern];
    if (!pattern) {
      return source;
    }

    const palette = [
      parseHexColor(settings.color1),
      parseHexColor(settings.color2),
    ];
    const pixelation = Math.max(1, Math.floor(settings.pixelation));
    const errorBuffer = new Float32Array(width * height * 3);
    const kernelEntries = pattern.kernel as ReadonlyArray<KernelEntry>;
    const { divisor } = pattern;

    for (let y = 0; y < height; y += pixelation) {
      for (let x = 0; x < width; x += pixelation) {
        const sampleX = Math.min(x + Math.floor(pixelation / 2), width - 1);
        const sampleY = Math.min(y + Math.floor(pixelation / 2), height - 1);
        const pixelIndex = (sampleY * width + sampleX) * 4;
        const errorIndex = (sampleY * width + sampleX) * 3;

        let r = data[pixelIndex] / 255;
        let g = data[pixelIndex + 1] / 255;
        let b = data[pixelIndex + 2] / 255;

        r = clamp(((r - 0.5) * settings.contrast + 0.5) * settings.brightness);
        g = clamp(((g - 0.5) * settings.contrast + 0.5) * settings.brightness);
        b = clamp(((b - 0.5) * settings.contrast + 0.5) * settings.brightness);

        r = clamp(r + errorBuffer[errorIndex]);
        g = clamp(g + errorBuffer[errorIndex + 1]);
        b = clamp(b + errorBuffer[errorIndex + 2]);

        const [nr, ng, nb] = findClosestPaletteColor(r, g, b, palette);
        const errorR = r - nr;
        const errorG = g - ng;
        const errorB = b - nb;

        for (let dy = 0; dy < pixelation && y + dy < height; dy++) {
          for (let dx = 0; dx < pixelation && x + dx < width; dx++) {
            const blockIndex = ((y + dy) * width + (x + dx)) * 4;
            data[blockIndex] = Math.round(nr * 255);
            data[blockIndex + 1] = Math.round(ng * 255);
            data[blockIndex + 2] = Math.round(nb * 255);
          }
        }

        for (const entry of kernelEntries) {
          const [offsetX, offsetY, weight] = entry;
          const targetX = sampleX + offsetX * pixelation;
          const targetY = sampleY + offsetY * pixelation;
          if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
            continue;
          }
          const targetIndex = (targetY * width + targetX) * 3;
          const scaledWeight = (weight / divisor) * settings.threshold;

          errorBuffer[targetIndex] += errorR * scaledWeight;
          errorBuffer[targetIndex + 1] += errorG * scaledWeight;
          errorBuffer[targetIndex + 2] += errorB * scaledWeight;
        }
      }
    }

    this.tempContext.putImageData(imageData, 0, 0);
    return this.tempCanvas;
  }

  render(source: CanvasSource, settings: DitherEffectSettings) {
    const processed = this.applyErrorDiffusion(source, settings);
    if (processed === source && !this.fallbackContext) {
      return;
    }

    const width = processed.width;
    const height = processed.height;

    if (this.gpuContext && this.device && this.pipeline && this.sampler) {
      this.ensureSourceTexture(width, height);
      if (!this.sourceTexture) {
        return;
      }

      this.device.queue.copyExternalImageToTexture(
        { source: processed, flipY: false },
        { texture: this.sourceTexture },
        [width, height]
      );

      const bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.sourceTexture.createView() },
          { binding: 1, resource: this.sampler },
        ],
      });

      const encoder = this.device.createCommandEncoder();
      const textureView = this.gpuContext.getCurrentTexture().createView();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            loadOp: "clear",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
          },
        ],
      });

      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();

      this.device.queue.submit([encoder.finish()]);
      return;
    }

    if (!this.fallbackContext) {
      this.fallbackContext = this.outputCanvas.getContext("2d");
    }
    if (!this.fallbackContext) {
      return;
    }

    if (this.outputCanvas.width !== width || this.outputCanvas.height !== height) {
      this.outputCanvas.width = width;
      this.outputCanvas.height = height;
    }
    this.fallbackContext.clearRect(0, 0, width, height);
    this.fallbackContext.drawImage(processed as CanvasImageSource, 0, 0);
  }

  destroy() {
    this.sourceTexture?.destroy();
    this.sourceTexture = null;
    this.pipeline = null;
    this.sampler = null;
    this.device = null;
    this.gpuContext = null;
  }
}

export type DitherCanvasProps = {
  source?: HTMLCanvasElement | null;
  settings?: Partial<DitherEffectSettings>;
  className?: string;
  style?: CSSProperties;
};

export function DitherCanvasOverlay({
  source,
  settings,
  className,
  style,
}: DitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<DitherRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
  const settingsRef = useRef<DitherEffectSettings>(
    DEFAULT_DITHER_SETTINGS
  );

  const mergedSettings = useMemo(() => {
    return {
      ...DEFAULT_DITHER_SETTINGS,
      ...(settings ?? {}),
    };
  }, [settings]);

  useEffect(() => {
    settingsRef.current = mergedSettings;
  }, [mergedSettings]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const renderer = new DitherRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.initializeGPU().catch(() => {
      // GPU initialization is optional, we can fall back to Canvas2D.
    });
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source || !rendererRef.current || !canvasRef.current) {
      return;
    }

    let cancelled = false;
    const targetCanvas = canvasRef.current;

    const syncSize = () => {
      targetCanvas.style.width = `${source.clientWidth}px`;
      targetCanvas.style.height = `${source.clientHeight}px`;
      targetCanvas.width = source.width;
      targetCanvas.height = source.height;
    };
    syncSize();

    const renderFrame = () => {
      if (cancelled) {
        return;
      }
      syncSize();
      rendererRef.current?.render(source, settingsRef.current);
      frameRef.current = requestAnimationFrame(renderFrame);
    };

    frameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      cancelled = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [source]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "none", ...style }}
    />
  );
}

export { ERROR_DIFFUSION_PATTERNS, DEFAULT_DITHER_SETTINGS };
