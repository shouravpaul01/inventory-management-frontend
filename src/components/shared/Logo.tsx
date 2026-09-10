
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  src?:string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export default function Logo({
  href = "/",
  src="/logo.svg",
  className,
  width = 160,
  height = 60,
  priority = true,
}: LogoProps) {
  const logo = (
    <Image
      src={src}
      alt="Logo"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority={priority}
    />
  );

  
  if (href) {
    return (
      <Link href={href} className="flex items-center shrink-0">
        {logo}
      </Link>
    );
  }

  // 👉 if only image needed (no link)
  return logo;
}