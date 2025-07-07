
import { getGame, getTournamentsByGameId } from "@/lib/firebase/firestore";
import { TournamentsClient } from "./client";
import { notFound } from "next/navigation";
import { type Game, type Tournament } from "@/types";

export default async function TournamentsPage({ params }: { params: { gameId: string } }) {
    const { gameId } = params;

    const game: Game | null = await getGame(gameId);
    
    if (!game) {
        notFound();
    }
    
    const tournaments: Tournament[] = await getTournamentsByGameId(gameId);

    return (
        <TournamentsClient game={game} tournaments={tournaments} />
    );
}

    