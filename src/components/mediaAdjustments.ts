export type MediaAdjustments = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
};

export const MEDIA_ADJUSTMENT_DEFAULTS: Required<MediaAdjustments> = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
};

export const resolveMediaAdjustments = (
  adjustments?: MediaAdjustments
): Required<MediaAdjustments> => ({
  brightness:
    typeof adjustments?.brightness === "number"
      ? adjustments.brightness
      : MEDIA_ADJUSTMENT_DEFAULTS.brightness,
  contrast:
    typeof adjustments?.contrast === "number"
      ? adjustments.contrast
      : MEDIA_ADJUSTMENT_DEFAULTS.contrast,
  saturation:
    typeof adjustments?.saturation === "number"
      ? adjustments.saturation
      : MEDIA_ADJUSTMENT_DEFAULTS.saturation,
});
