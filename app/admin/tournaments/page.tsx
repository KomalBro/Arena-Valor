import { TournamentsClient } from "./client";
import { getGames, getAllTournaments } from "@/lib/firebase/firestore";

export default async function ManageTournamentsPage() {
    const games = await getGames();
    const tournaments = await getAllTournaments();

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Manage Tournaments
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Create, edit, and manage all game tournaments.
            </p>
            <div className="mt-8">
                <TournamentsClient initialTournaments={tournaments} games={games} />
            </div>
        </div>
    );
}
