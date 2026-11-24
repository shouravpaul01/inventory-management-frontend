import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/redux/ReduxProvider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UniInventory | University Department Inventory System",
    template: "%s | UniInventory",
  },
  description:
    "Department inventory, requisition, distribution and asset tracking system for university departments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ReduxProvider><TooltipProvider><Toaster richColors />{children}</TooltipProvider></ReduxProvider>
      </body>
    </html>
  );
}