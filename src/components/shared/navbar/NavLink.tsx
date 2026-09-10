"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
  exact?: boolean;

  // customizable styles
 className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  showUnderline?: boolean;
  underlineClassName?: string;
};

export default function NavLink({
  href,
  label,
  exact = true,
  className,
  activeClassName = "text-primary",
  inactiveClassName = "text-neutral-800 hover:text-primary",
  showUnderline = true,
  underlineClassName = "bg-primary",
}: NavLinkProps) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "block w-full relative px-3 py-2 text-sm  font-medium transition",
        isActive ? activeClassName : inactiveClassName,className
      )}
    >
      {label}

      {/*  Underline optional */}
      {isActive && showUnderline && (
        <span
          className={cn(
            "absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-0.5",
            underlineClassName
          )}
        />
      )}
    </Link>
  );
}