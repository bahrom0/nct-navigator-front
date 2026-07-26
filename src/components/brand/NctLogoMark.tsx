import Image from "next/image";

type NctLogoMarkProps = {
  className?: string;
  width?: number;
  height?: number;
};

/** Brand mark that automatically switches to the readable logo for the active theme. */
export function NctLogoMark({ className = "", width = 34, height = 18 }: NctLogoMarkProps) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden="true">
      <Image
        src="/presentation/icon-nct-light.png"
        alt=""
        width={width}
        height={height}
        className="nct-logo-light h-auto w-auto"
        draggable={false}
      />
      <Image
        src="/presentation/icon-nct-dark.png"
        alt=""
        width={width}
        height={height}
        className="nct-logo-dark h-auto w-auto"
        draggable={false}
      />
    </span>
  );
}
