import { GamesClient } from "./client";
import { getGames } from "@/lib/firebase/firestore";

export default async function ManageGamesPage() {
    const games = await getGames();

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Manage Games
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Add, edit, or delete games available for tournaments.
            </p>
            <div className="mt-8">
                <GamesClient initialGames={games} />
            </div>
        </div>
    );
}
