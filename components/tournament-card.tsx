
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Tournament, type Player } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, Trophy, Zap, VenetianMask, BarChart, Copy, Eye, EyeOff, Check, Loader2, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { joinTournament, getTournamentParticipants } from "@/lib/firebase/firestore";
import { Badge } from "./ui/badge";

interface TournamentCardProps {
    tournament: Tournament;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function TournamentCard({ tournament }: TournamentCardProps) {
    const { id: tournamentId, name, prizePool, prizeDescription, entryFee, perKillReward, startTime, playersJoined, maxPlayers, status, results, roomId, roomPassword, teamType, map, mode, rules } = tournament;
    
    const router = useRouter();
    const { user, userProfile, loading: authLoading, joinedTournamentIds, addJoinedTournament } = useAuth();
    
    const [hasUserJoined, setHasUserJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
    const [isPlayersDialogOpen, setIsPlayersDialogOpen] = useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

    const [participants, setParticipants] = useState<Player[]>([]);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

    const numPlayers = teamType === 'duo' ? 2 : teamType === 'squad' ? 4 : 1;
    const [teamMemberNames, setTeamMemberNames] = useState<string[]>(Array(numPlayers).fill(""));
    
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setHasUserJoined(joinedTournamentIds.has(tournamentId));
    }, [joinedTournamentIds, tournamentId]);

    useEffect(() => {
        const newNumPlayers = tournament.teamType === 'duo' ? 2 : tournament.teamType === 'squad' ? 4 : 1;
        setTeamMemberNames(Array(newNumPlayers).fill(""));
    }, [isJoinDialogOpen, tournament.teamType]);

    const formattedDate = (startTime instanceof Date ? startTime : startTime.toDate()).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
    });

    const spotsFilledPercentage = (playersJoined / maxPlayers) * 100;

    const handleTeamNameChange = (index: number, value: string) => {
        const newNames = [...teamMemberNames];
        newNames[index] = value;
        setTeamMemberNames(newNames);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to join a tournament." });
            return;
        }
        
        const filledNames = teamMemberNames.filter(name => name.trim() !== "");
        if (filledNames.length < numPlayers) {
             toast({ variant: "destructive", title: "In-Game Names Required", description: `Please enter all ${numPlayers} in-game names for your team.` });
            return;
        }

        setIsJoining(true);
        try {
            const teamData = teamMemberNames.map(name => ({ inGameName: name }));
            await joinTournament(user, userProfile, tournament, teamData);
            
            addJoinedTournament(tournamentId);
            setHasUserJoined(true);
            
            toast({ title: "Successfully Joined!", description: `You have joined the "${name}" tournament.` });
            setIsJoinDialogOpen(false);
            router.refresh(); // This re-fetches the player count
        } catch (error: any) {
            toast({ variant: "destructive", title: "Join Failed", description: error.message });
        } finally {
            setIsJoining(false);
        }
    };
    
    const handleViewPlayers = async () => {
        setIsPlayersDialogOpen(true);
        if (participants.length > 0 || playersJoined === 0) return; // Already fetched or no one to fetch
        
        setIsLoadingParticipants(true);
        const fetchedParticipants = await getTournamentParticipants(tournamentId);
        setParticipants(fetchedParticipants);
        setIsLoadingParticipants(false);
    }

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: `${type} has been copied to your clipboard.`});
    };

    const getAction = () => {
        if (authLoading) {
            return <Button className="w-full font-bold" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>
        }

        switch (status) {
            case "upcoming":
                if (hasUserJoined) {
                    return (
                        <Button variant="outline" className="w-full font-bold" disabled>
                            <Check className="mr-2 h-4 w-4" />
                            Joined
                        </Button>
                    );
                }
                 if (playersJoined >= maxPlayers) {
                    return <Button className="w-full font-bold" disabled>Tournament Full</Button>;
                }
                return <Button className="w-full font-bold" onClick={() => setIsJoinDialogOpen(true)}>Join Now - {formatCurrency(entryFee)}</Button>;
            
            case "ongoing":
                if (hasUserJoined) {
                    return <Button variant="secondary" className="w-full font-bold" onClick={() => setIsRoomDialogOpen(true)}><VenetianMask className="mr-2 h-4 w-4" />View Room ID</Button>;
                }
                return <Button className="w-full font-bold" disabled>Registration Closed</Button>;

            case "completed":
                return <Button variant="outline" className="w-full font-bold" onClick={() => setIsResultsDialogOpen(true)}><BarChart className="mr-2 h-4 w-4" />View Results</Button>;
            
             case "cancelled":
                return <Button variant="destructive" className="w-full font-bold" disabled>Cancelled</Button>;

            default:
                return null;
        }
    };

    const getJoinDateString = (joinTime: any) => {
        if (!joinTime) return "N/A";
        const date = joinTime?.toDate ? joinTime.toDate() : new Date(joinTime);
        return date.toLocaleDateString();
    };

    return (
        <>
            <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-xl leading-tight truncate">{name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <div className="flex justify-between items-center text-primary">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            <span className="font-semibold">Prize Pool</span>
                        </div>
                        <span className="font-bold text-lg">{formatCurrency(prizePool)}</span>
                    </div>
                     {prizeDescription && (
                        <p className="text-xs text-muted-foreground px-1">{prizeDescription}</p>
                    )}
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Per Kill</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(perKillReward)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground h-5">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate} UTC</span>
                    </div>
                    <div>
                        <div className="mb-1 flex justify-between items-end">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>Spots</span>
                            </div>
                            <span className="text-sm font-semibold">{playersJoined} / {maxPlayers}</span>
                        </div>
                        <Progress value={spotsFilledPercentage} className="h-2" />
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-center gap-2 pt-4">
                    {getAction()}
                    <div className="flex justify-between w-full items-center mt-2">
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-muted-foreground hover:text-primary"
                            onClick={handleViewPlayers}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            View Players ({playersJoined})
                        </Button>
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-muted-foreground hover:text-primary"
                            onClick={() => setIsDetailsDialogOpen(true)}
                        >
                            <Info className="mr-2 h-4 w-4" />
                            View Details
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Join Tournament Dialog */}
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogContent className="sm:max-w-md">
                     <form onSubmit={handleJoin}>
                        <DialogHeader>
                            <DialogTitle>Join "{name}"</DialogTitle>
                            <DialogDescription>
                                Confirm your team's in-game names and pay the entry fee of {formatCurrency(entryFee)} to join.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                            <div className="grid gap-4 py-4 pr-6">
                                {Array.from({ length: numPlayers }).map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label htmlFor={`ingame-name-${index}`}>Player {index + 1} In-Game Name</Label>
                                        <Input
                                            id={`ingame-name-${index}`}
                                            value={teamMemberNames[index]}
                                            onChange={(e) => handleTeamNameChange(index, e.target.value)}
                                            placeholder="Enter player name"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isJoining}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isJoining}>
                                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Join
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* View Details Dialog */}
            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tournament Details</DialogTitle>
                        <DialogDescription>{name}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-4">
                        <div className="space-y-4 py-4">
                             <div className="space-y-2">
                                <h4 className="font-semibold">Match Info</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                                        <Badge variant="secondary">Map</Badge>
                                        <span>{map || 'Not specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                                        <Badge variant="secondary">Mode</Badge>
                                        <span>{mode || 'Not specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                                        <Badge variant="secondary">Type</Badge>
                                        <span className="capitalize">{teamType}</span>
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <h4 className="font-semibold">Prize Distribution</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prizeDescription || 'Details not provided.'}</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Rules & Regulations</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rules || 'No special rules provided.'}</p>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button">Close</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Room Dialog */}
            <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Room Details - {name}</DialogTitle>
                         <DialogDescription>
                            {hasUserJoined ? "Use these details to join the custom room in the game." : "You must join the tournament to view room details."}
                        </DialogDescription>
                    </DialogHeader>
                    {hasUserJoined && roomId ? (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Room ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={roomId} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(roomId, 'Room ID')}><Copy className="h-4 w-4"/></Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Password</Label>
                                <div className="relative flex items-center gap-2">
                                    <Input value={roomPassword} readOnly type={showPassword ? 'text' : 'password'} />
                                    <Button size="icon" variant="ghost" className="absolute right-12" onClick={() => setShowPassword(p => !p)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(roomPassword!, 'Password')}><Copy className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Room details will be available when the tournament starts.
                        </div>
                    )}
                </DialogContent>
            </Dialog>

             {/* View Players Dialog */}
            <Dialog open={isPlayersDialogOpen} onOpenChange={setIsPlayersDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Players in "{name}"</DialogTitle>
                        <DialogDescription>
                            {playersJoined} / {maxPlayers} players have joined this tournament.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-2">
                            {isLoadingParticipants ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : participants.length > 0 ? (
                                participants.map(player => (
                                    <div key={player.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                                        <div>
                                            <span className="font-medium">{player.inGameName}</span>
                                            {player.teamMembers && player.teamMembers.length > 1 && (
                                                <span className="text-muted-foreground text-xs ml-2">(Team)</span>
                                            )}
                                        </div>
                                        <span className="text-muted-foreground text-xs">Joined: {getJoinDateString(player.joinTime)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">No players have joined yet.</p>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Results Dialog */}
            <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                     <DialogHeader>
                        <DialogTitle>Results - {name}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Kills</TableHead>
                                    <TableHead className="text-right">Prize</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results && results.length > 0 ? (
                                    results.sort((a, b) => a.rank - b.rank).map(result => (
                                        <TableRow key={result.playerId} className={cn(result.playerId === user?.uid && 'bg-accent/50')}>
                                            <TableCell className="font-bold">{result.rank}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{result.name}</div>
                                                <div className="text-xs text-muted-foreground">{result.inGameName}</div>
                                            </TableCell>
                                            <TableCell>{result.kills}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(result.prize)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Results are not yet announced.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
