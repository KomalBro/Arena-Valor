
import { SupportClient } from "./client";

export default function ManageSupportPage() {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Support Tickets
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Manage and respond to user support requests.
            </p>
            <div className="mt-8">
                <SupportClient />
            </div>
        </div>
    );
}
