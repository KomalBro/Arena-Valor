import Link from "next/link";
import { Logo } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
            <Logo className="h-8 w-8 text-primary" />
            <p className="ml-2 text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Arena Valor. All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}
