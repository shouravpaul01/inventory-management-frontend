import Link from "next/link";
import { FacebookIcon, LinkedInIcon, YouTubeIcon } from "./Icon";
import { cn } from "@/lib/utils";

export default function SocialIcons({ className }: { className?: string }) {
  const socialLinks = [
    { icon: FacebookIcon, href: "#", label: "LinkedIn" },
    { icon: YouTubeIcon, href: "#", label: "Instagram" },
    { icon: LinkedInIcon, href: "#", label: "Facebook" },
  ];
  return (
    <div className="flex items-center gap-4">
      {socialLinks?.map(({ icon: Icon, href, label }) => (
        <Link
          key={label}
          href={href}
          aria-label={label}
          className={cn(
            "group relative size-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10  transition-all duration-300 hover:scale-110",
          className)}
        >
          {/* Glow Effect */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-30 blur-md transition duration-300"></span>

          {/* Border Glow */}
          <span className="absolute inset-0 rounded-full border border-transparent group-hover:border-primary transition-all duration-300"></span>

          {/* Icon */}
          <Icon className="relative size-6 text-gray-300 group-hover:text-white transition duration-300" />
        </Link>
      ))}
    </div>
  );
}
