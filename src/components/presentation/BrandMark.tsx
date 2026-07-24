import styles from "./presentation.module.css";

export function BrandMark({
  variant = "dark",
  compact = false,
}: {
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  const src =
    variant === "dark"
      ? "/presentation/icon-nct-dark.png"
      : "/presentation/icon-nct-light.png";

  return (
    <div className={compact ? styles.brandCompact : styles.brand}>
      <img src={src} alt="NCT" draggable={false} />
      <span>Navigator</span>
    </div>
  );
}
