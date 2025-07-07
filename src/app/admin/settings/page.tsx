import { type AppSettings } from "@/types";
import { SettingsClient } from "./client";
import { appSettings } from "@/lib/mock-data";

export default function AdminSettingsPage() {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Application Settings
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Manage your application's global settings and policies.
            </p>
            <div className="mt-8">
                <SettingsClient initialSettings={appSettings} />
            </div>
        </div>
    );
}
