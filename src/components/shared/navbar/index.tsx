import Link from "next/link";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";




import NavLink from "./NavLink";

import { navLinks } from "@/constant";
import Logo from "../Logo";



export default function Navbar() {

  return (
    <header className="w-full  sticky top-0 z-50">

      {/* Navbar */}
      <nav className=" bg-[#FFF5EB]  flex items-center py-1 ">
        <div className="container flex items-center justify-between">
          <Logo  />

          {/* Desktop Menu */}

          <ul className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
             

              // NORMAL LINK
              return (
                <li key={link?.label}>
                  <NavLink href={link?.href as string} label={link?.label.toUpperCase() as string} />
                </li>
              );
            })}
          </ul>
          {/* Desktop Button */}

          <Button size={"lg"} className="px-3 hidden md:block">
            <Link href="/book">Add List</Link>
          </Button>

          {/* Mobile Menu Button */}
          {/* <MobileMenu  /> */}
          <Sheet>
            <SheetTrigger className="md:hidden flex">
              <Menu className="w-6 h-6" />
            </SheetTrigger>

            <SheetContent side="right" className="w-[280px] p-0">
              {/* Header */}
              <Logo className="my-3 mx-2" />

             

              {/* Links */}
              <ul className=" px-4 py-4 space-y-4">
                {navLinks?.map((link) => {
                  return (
                    <li key={link?.label}>
                      <SheetClose className="w-full">
                        <NavLink
                          href={link?.href as string}
                          label={link?.label.toUpperCase() as string} 
                          className="w-full! rounded-md flex"
                          activeClassName="bg-orange-50 text-primary"
                          inactiveClassName="text-gray-600 hover:bg-orange-50 "
                          showUnderline={false}
                        />
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>

              <Separator />

              {/* Button */}
              <div className="p-4">
                <Button  className="h-11">
                  <Link href="/book">Add List</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
