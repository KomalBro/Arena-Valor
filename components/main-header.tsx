
"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/icons";
import { LifeBuoy, LogOut, User, Menu, Gamepad2, Trophy, Wallet, Coins, FileText } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Gamepad2 },
    { name: "My Contests", href: "/my-contests", icon: Trophy },
    { name: "Wallet", href: "/wallet", icon: Wallet },
];

const policyLinks = [
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Fair Play Policy", href: "/fair-play" },
];

export default function MainHeader() {
  const { user, userProfile, logout } = useAuth();
  const displayName = userProfile?.name || user?.email?.split('@')[0] || "User";
  const fallback = displayName.charAt(0).toUpperCase();

  const walletBalance = userProfile ? userProfile.depositBalance + userProfile.winningsBalance : 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="hidden font-headline text-xl font-bold sm:inline-block">
              Arena Valor
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button key={link.name} variant="link" asChild className="text-base font-semibold text-muted-foreground hover:text-foreground">
                <Link href={link.href}>{link.name}</Link>
              </Button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {userProfile && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-secondary-foreground">
                {new Intl.NumberFormat("en-IN", { style: "decimal", maximumFractionDigits: 2 }).format(walletBalance)}
              </span>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={userProfile?.profilePhotoUrl || user.photoURL || `https://placehold.co/100x100.png`} alt={displayName} data-ai-hint="profile avatar" />
                    <AvatarFallback>{fallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {policyLinks.map((link) => (
                    <DropdownMenuItem key={link.name} asChild>
                         <Link href={link.href}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{link.name}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                   <LogOut className="mr-2 h-4 w-4" />
                   <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-xs p-0">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Logo className="h-8 w-8 text-primary" />
                                <span className="font-headline text-xl font-bold">Arena Valor</span>
                            </Link>
                        </div>
                        <nav className="flex flex-col gap-2 p-4">
                            {navLinks.map((link) => (
                                <SheetClose key={link.name} asChild>
                                    <Link
                                        href={link.href}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-secondary"
                                    >
                                        <link.icon className="h-5 w-5" />
                                        <span className="text-lg font-medium">{link.name}</span>
                                    </Link>
                                </SheetClose>
                            ))}
                        </nav>
                         {userProfile && (
                          <div className="mt-auto p-4 border-t">
                             <div className="flex items-center justify-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                                <Coins className="h-5 w-5 text-yellow-500" />
                                <span className="font-semibold text-secondary-foreground">
                                  Balance: {new Intl.NumberFormat("en-IN", { style: "decimal", maximumFractionDigits: 2 }).format(walletBalance)}
                                </span>
                              </div>
                          </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
