"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ImageModalProps {
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Intrinsic pixel size of the source file. Defaults to the 3:2 assumption the first two
   * call sites (omnopsis) were built against — pass the real numbers for anything else, or
   * next/image scales against a ratio the file does not have.
   */
  width?: number;
  height?: number;
  /**
   * Hard ceiling for the enlarged view, in px. The modal never fills the whole screen
   * (Founder, 2026-08-15): a screenshot blown up to 4K reads worse, not better. The
   * viewport caps (90vw / 85vh) still apply on top of this.
   */
  maxWidthPx?: number;
}

export default function ImageModal({
  src,
  alt,
  children,
  className,
  width = 1200,
  height = 800,
  maxWidthPx = 1200,
}: ImageModalProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || "cursor-pointer text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:text-accent-hover hover:decoration-accent dark:text-accent-bright"}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            style={{ width: `min(${maxWidthPx}px, 90vw)` }}
          >
            <button
              onClick={close}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-surface p-2 text-text-primary shadow-lg transition-colors hover:bg-accent"
              aria-label="Schließen"
            >
              <X size={20} />
            </button>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="h-auto max-h-[85vh] w-full rounded-xl object-contain"
              quality={80}
            />
          </div>
        </div>
      )}
    </>
  );
}
