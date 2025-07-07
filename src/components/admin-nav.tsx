
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Trophy,
  CreditCard,
  Settings,
  GalleryHorizontal,
  MessageSquare
} from "lucide-react";

const adminNavLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Games", href: "/admin/games", icon: Gamepad2 },
    { name: "Tournaments", href: "/admin/tournaments", icon: Trophy },
    { name: "Carousel", href: "/admin/carousel", icon: GalleryHorizontal },
    { name: "Withdrawals", href: "/admin/withdrawals", icon: CreditCard },
    { name: "Support", href: "/admin/support", icon: MessageSquare },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <ScrollArea className="flex-1">
        <nav className="grid items-start gap-1 p-2">
          {adminNavLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-base",
                  pathname.startsWith(link.href) && "bg-muted font-bold text-primary"
                )}
              >
                <link.icon className="mr-3 h-5 w-5" />
                {link.name}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
