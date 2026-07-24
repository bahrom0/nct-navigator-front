"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import styles from "./presentation.module.css";

export function ProductVisual({
  src,
  alt,
  label,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${styles.productVisual} ${className}`}>
      {failed ? (
        <div className={styles.visualPlaceholder}>
          <ImageIcon size={28} strokeWidth={1.5} />
          <strong>{label}</strong>
          <span>Замените файл — композиция сохранится</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 820px) 100vw, 55vw"
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
