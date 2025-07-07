
"use client";

import Image from "next/image";
import { type Game, type Tournament } from "@/types";
import { TournamentCard } from "@/components/tournament-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface TournamentsClientProps {
    game: Game;
    tournaments: Tournament[];
}

export function TournamentsClient({ game, tournaments }: TournamentsClientProps) {
    const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming');
    const ongoingTournaments = tournaments.filter(t => t.status === 'ongoing');
    const completedTournaments = tournaments.filter(t => t.status === 'completed');

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <Image
                    src={game.imageUrl}
                    alt={game.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover border-2 border-primary/50"
                />
                <div className="text-center sm:text-left">
                    <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {game.name} Tournaments
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Join the battle and compete for glory.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
                    <TabsTrigger value="ongoing">Ongoing ({ongoingTournaments.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                    {upcomingTournaments.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No upcoming tournaments for this game.</p>
                    )}
                </TabsContent>
                <TabsContent value="ongoing" className="mt-6">
                    {ongoingTournaments.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {ongoingTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No ongoing tournaments for this game.</p>
                    )}
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    {completedTournaments.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {completedTournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No completed tournaments for this game.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

const TournamentsPageSkeleton = () => (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <Skeleton className="h-[120px] w-[120px] rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-80" />
            </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
);

    
