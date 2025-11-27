// Core exports
export { default as Efecto } from "@/components/Efecto";

// Misc exports
export {
  buildAsciiEffectProps,
  type AsciiBaseProps,
} from "@/components/AsciiScene";

export {
  ASCII_POST_PROCESSING_DEFAULTS,
  type AsciiStyle,
  type PublicAsciiPostProcessingSettings,
} from "@/components/AsciiEffect";

export {
  buildDitherEffectProps,
  type DitherBaseProps,
} from "@/components/DitherScene";

export {
  DEFAULT_DITHER_SETTINGS,
  type DitherEffectSettings,
  type ErrorDiffusionPattern,
} from "@/components/DitherEffect";
