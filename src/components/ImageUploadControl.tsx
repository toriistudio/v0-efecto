"use client";

import { useEffect, useId, useMemo, useRef, type ChangeEvent } from "react";

type MediaType = "image" | "video";
export type UploadedMedia = {
  src: string;
  type: MediaType;
};

type PresetEntry = {
  src: string;
  label: string;
  type: MediaType;
};

const PRESET_MEDIA: PresetEntry[] = [
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/astronaut_q84mbj.png",
    label: "Astronaut",
    type: "image",
  },
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/surreal-head_r0ozcd.png",
    label: "Futuristic",
    type: "image",
  },
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233797/futuristic_bpwdzt.png",
    label: "Surreal",
    type: "image",
  },
  {
    src: "https://res.cloudinary.com/dz8kk1l4r/image/upload/v1763233793/portrait_hd7dyc.png",
    label: "Portrait",
    type: "image",
  },
];

type ImageUploadControlProps = {
  media: UploadedMedia | null;
  onSelectMedia: (media: UploadedMedia) => void;
  onClear: () => void;
  error?: string | null;
};

export default function ImageUploadControl({
  media,
  onSelectMedia,
  onClear,
  error,
}: ImageUploadControlProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (uploadedUrlRef.current) {
      URL.revokeObjectURL(uploadedUrlRef.current);
      uploadedUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    uploadedUrlRef.current = objectUrl;

    const isVideo = file.type.startsWith("video/");
    onSelectMedia({ src: objectUrl, type: isVideo ? "video" : "image" });
  };

  const thumbnailEntries = PRESET_MEDIA;

  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "0.5rem",
    }),
    []
  );

  const handleClear = () => {
    if (uploadedUrlRef.current) {
      URL.revokeObjectURL(uploadedUrlRef.current);
      uploadedUrlRef.current = null;
    }
    onClear();
  };

  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) {
        URL.revokeObjectURL(uploadedUrlRef.current);
        uploadedUrlRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <label htmlFor={inputId} style={{ fontSize: "0.85rem", fontWeight: 500 }}>
        Upload media
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*,video/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: "0.4rem",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Choose file
        </button>
        {media ? (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "0.35rem",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {media.type === "video" ? (
              <video
                src={media.src}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <img
                src={media.src}
                alt="Thumbnail"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
          </div>
        ) : null}
      </div>
      <div style={gridStyle}>
        {thumbnailEntries.map((entry) => {
          const isSelected =
            media?.src === entry.src && media?.type === entry.type;
          return (
            <button
              key={`${entry.src}-${entry.type}`}
              type="button"
              onClick={() =>
                onSelectMedia({ src: entry.src, type: entry.type })
              }
              style={{
                width: "100%",
                borderRadius: "0.4rem",
                border: isSelected
                  ? "2px solid rgba(255,255,255,0.8)"
                  : "1px solid rgba(255,255,255,0.25)",
                padding: 0,
                overflow: "hidden",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {entry.type === "video" ? (
                <video
                  src={entry.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: 100,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <img
                  src={entry.src}
                  alt={entry.label}
                  style={{
                    width: "100%",
                    height: 100,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {error ? (
        <p style={{ color: "#ff9da4", fontSize: "0.8rem" }}>{error}</p>
      ) : null}
      {media ? (
        <>
          {media.type === "video" ? (
            <video
              src={media.src}
              controls
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: "100%",
                maxHeight: 200,
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                objectFit: "cover",
                backgroundColor: "black",
              }}
            />
          ) : (
            <img
              src={media.src}
              alt="Uploaded preview"
              style={{
                width: "100%",
                maxHeight: 200,
                objectFit: "contain",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            />
          )}
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "0.4rem",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Remove media
          </button>
        </>
      ) : null}
    </div>
  );
}
