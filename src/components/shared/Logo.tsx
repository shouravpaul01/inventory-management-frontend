import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
  showText?: boolean;
  showImage?: boolean;
  imageSrc?: string;
  image?: React.ReactNode;
  imageAlt?: string;
  imageClassName?: string;
  imageWrapperClassName?: string;
  width?: number;
  height?: number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function Logo({
  href = "/dashboard",
  className,
  showText = true,
  showImage = true,
  imageSrc = "/logo.png",
  image,
  imageAlt,
  imageClassName,
  imageWrapperClassName,
  width = 36,
  height = 36,
  title = "UniInventory",
  description = "Department Portal",
  titleClassName,
  descriptionClassName,
}: LogoProps) {
  const renderedImage = image ? (
    image
  ) : imageSrc ? (
    <Image
      src={imageSrc}
      alt={imageAlt || (typeof title === "string" ? title : "Logo")}
      width={width}
      height={height}
      className={cn("h-9 w-9 shrink-0 object-contain", imageClassName)}
      priority
    />
  ) : null;

  const content = (
    <div className={cn("flex items-center gap-2.5 px-2 py-1.5", className)}>
      {showImage && renderedImage && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center",
            imageWrapperClassName
          )}
        >
          {renderedImage}
        </div>
      )}
      {showText && (
        <div className="flex flex-col text-left leading-none overflow-hidden group-data-[collapsible=icon]:hidden">
          {title && (
            <span
              className={cn(
                "font-bold text-sm tracking-tight text-foreground truncate",
                titleClassName
              )}
            >
              {title}
            </span>
          )}
          {description && (
            <span
              className={cn(
                "text-[11px] text-muted-foreground font-medium truncate",
                descriptionClassName
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
