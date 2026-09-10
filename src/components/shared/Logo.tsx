import Link from "next/link";
import { cn } from "@/lib/utils";
import { Boxes } from "lucide-react";

type LogoProps = {
  href?: string;
  className?: string;
  collapsed?: boolean;
};

export default function Logo({
  href = "/dashboard",
  className,
  collapsed = false,
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
        <Boxes className="size-5" />
      </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm tracking-tight text-foreground truncate">
            UniInventory
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold truncate">
            Dept Asset Portal
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center shrink-0 focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}