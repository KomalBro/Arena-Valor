
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AdminHeader from "@/components/admin-header";
import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push("/login");
      } else if (userProfile && userProfile.role !== 'admin') {
        // Logged in but not an admin, redirect to user dashboard
        router.push("/dashboard");
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || !userProfile || userProfile.role !== 'admin') {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Logo className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl font-bold text-foreground">
              Arena Valor
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {adminNavLinks.map((link) => (
              <SidebarMenuItem key={link.name}>
                 <Link href={link.href} className="w-full">
                  <SidebarMenuButton
                    isActive={pathname.startsWith(link.href)}
                    className="w-full"
                    tooltip={link.name}
                  >
                    <link.icon />
                    <span>{link.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
