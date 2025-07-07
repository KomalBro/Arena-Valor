"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-sm border-b" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-bold">Arena Valor</span>
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <div className="flex flex-col gap-4 p-4">
                        <Link href="/login" className="text-lg font-medium">Login</Link>
                        <Button asChild>
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
