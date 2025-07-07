
"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect once we have a user AND their profile.
    // This prevents redirecting during signup before the profile is created.
    if (!loading && user && userProfile) {
      if (userProfile.role === 'admin') {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, userProfile, loading, router]);

  // Show a spinner during initial load or once the user is fully logged in (with profile) and ready for redirect.
  // This prevents the premature unmounting of the signup form.
  if (loading || (user && userProfile)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Logo className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary via-primary/50 to-accent opacity-20" />
      <div className="relative z-10 w-full max-w-md p-4">{children}</div>
    </div>
  );
}
