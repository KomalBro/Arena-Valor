
"use client";

import { useEffect, useState } from "react";
import { TournamentCard } from "@/components/tournament-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { getUserJoinedTournaments } from "@/lib/firebase/firestore";
import { type Tournament } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyContestsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [joinedUpcoming, setJoinedUpcoming] = useState<Tournament[]>([]);
    const [joinedCompleted, setJoinedCompleted] = useState<Tournament[]>([]);

    useEffect(() => {
        if (user) {
            const fetchContests = async () => {
                setLoading(true);
                const allJoined = await getUserJoinedTournaments(user.uid);
                setJoinedUpcoming(allJoined.filter(t => t.status === 'upcoming' || t.status === 'ongoing'));
                setJoinedCompleted(allJoined.filter(t => t.status === 'completed' || t.status === 'cancelled'));
                setLoading(false);
            };
            fetchContests();
        }
    }, [user]);

    if (loading) {
        return <ContestsSkeleton />;
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                My Contests
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Track your upcoming and completed tournaments.
            </p>

             <Tabs defaultValue="upcoming" className="w-full mt-8">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">Upcoming ({joinedUpcoming.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({joinedCompleted.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-6">
                     {joinedUpcoming.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {joinedUpcoming.map(t => <TournamentCard key={t.id} tournament={t} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">You haven't joined any upcoming tournaments.</p>
                    )}
                </TabsContent>
                <TabsContent value="completed" className="mt-6">
                    {joinedCompleted.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {joinedCompleted.map(t => <TournamentCard key={t.id} tournament={t} />)}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-10">You have no completed tournaments.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

const ContestsSkeleton = () => (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/2 mt-2" />
        <div className="mt-8">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    </div>
);
