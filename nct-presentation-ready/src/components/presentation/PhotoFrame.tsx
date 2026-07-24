"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";
import styles from "./presentation.module.css";

export function PhotoFrame({
  src,
  alt,
  fileLabel,
  className = "",
}: {
  src: string;
  alt: string;
  fileLabel: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${styles.photoFrame} ${className}`}>
      {!failed ? (
        <img src={src} alt={alt} onError={() => setFailed(true)} draggable={false} />
      ) : null}
      <div className={styles.photoPlaceholder} aria-hidden={!failed}>
        <div className={styles.photoGrid} />
        <div className={styles.photoPlaceholderLabel}>
          <ImageIcon size={18} />
          <span>{fileLabel}</span>
        </div>
      </div>
    </div>
  );
}
