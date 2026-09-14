import Link from "next/link";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
  showText?: boolean;
};

export default function Logo({
  href = "/dashboard",
  className,
  showText = true,
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2.5 px-2 py-1.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Boxes className="size-5" />
      </div>
      {showText && (
        <div className="flex flex-col text-left leading-none overflow-hidden">
          <span className="font-bold text-sm tracking-tight text-foreground truncate">
            UniInventory
          </span>
          <span className="text-[11px] text-muted-foreground font-medium truncate">
            Department Portal
          </span>
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