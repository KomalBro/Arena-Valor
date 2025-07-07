
"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, Calendar as CalendarIcon, Copy, Eye, EyeOff, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { addTournament, updateTournament, deleteTournament, getTournamentParticipants, submitTournamentResults } from "@/lib/firebase/firestore"

import { type Tournament, type Game, type TournamentStatus, type TournamentResult, type Player, type TeamType } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { getColumns } from "./columns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

interface TournamentsClientProps {
  initialTournaments: Tournament[]
  games: Game[]
}

const tournamentFormSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters."),
  gameId: z.string({ required_error: "Please select a game." }),
  entryFee: z.coerce.number().min(0),
  prizePool: z.coerce.number().min(0),
  prizeDescription: z.string().optional(),
  perKillReward: z.coerce.number().min(0),
  startTime: z.date({ required_error: "A start date is required." }),
  maxPlayers: z.coerce.number().min(1, "Maximum players must be at least 1."),
  teamType: z.enum(['solo', 'duo', 'squad'], { required_error: "Please select a team type." }),
  map: z.string().optional(),
  mode: z.string().optional(),
  rules: z.string().optional(),
})

type TournamentFormValues = z.infer<typeof tournamentFormSchema>
type ResultInput = Omit<TournamentResult, 'playerId' | 'name' | 'email' | 'inGameName' | 'joinTime' | 'teamMembers'>

export function TournamentsClient({ initialTournaments, games }: TournamentsClientProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isRoomIdDialogOpen, setIsRoomIdDialogOpen] = useState(false)
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false)
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false)
  const [isViewResultsDialogOpen, setIsViewResultsDialogOpen] = useState(false)

  const [roomId, setRoomId] = useState("")
  const [roomPassword, setRoomPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [results, setResults] = useState<ResultInput[]>([])

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: { name: "", entryFee: 0, prizePool: 0, prizeDescription: "", perKillReward: 0, maxPlayers: 100, teamType: 'solo', map: '', mode: '', rules: '' },
  })
  
  const updateTournamentState = (tournamentId: string, updates: Partial<Tournament>) => {
    setTournaments(tournaments.map(t => t.id === tournamentId ? { ...t, ...updates } : t))
  }

  const handleOpenFormDialog = (tournament: Tournament | null = null) => {
    setEditingTournament(tournament)
    if (tournament) {
      form.reset({
        name: tournament.name,
        gameId: tournament.gameId,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        prizeDescription: tournament.prizeDescription || "",
        perKillReward: tournament.perKillReward,
        startTime: tournament.startTime instanceof Date ? tournament.startTime : tournament.startTime.toDate(),
        maxPlayers: tournament.maxPlayers,
        teamType: tournament.teamType,
        map: tournament.map || '',
        mode: tournament.mode || '',
        rules: tournament.rules || '',
      })
    } else {
      form.reset({ name: "", gameId: undefined, entryFee: 0, prizePool: 0, prizeDescription: "", perKillReward: 0, startTime: undefined, maxPlayers: 100, teamType: 'solo', map: '', mode: '', rules: '' })
    }
    setIsFormDialogOpen(true)
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      await deleteTournament(tournamentId);
      setTournaments(tournaments.filter((t) => t.id !== tournamentId));
      toast({ variant: "destructive", title: "Tournament Deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  }
  
  const onSubmit = async (values: TournamentFormValues) => {
    setIsSubmitting(true);
    const selectedGame = games.find(g => g.id === values.gameId)!;

    try {
        if (editingTournament) {
            const updatedData = { ...editingTournament, ...values, gameName: selectedGame.name, gameImageUrl: selectedGame.imageUrl };
            await updateTournament(editingTournament.id, updatedData);
            updateTournamentState(editingTournament.id, updatedData);
            toast({ title: "Tournament Updated" });
        } else {
            const newTournamentData = {
                ...values,
                gameName: selectedGame.name,
                gameImageUrl: selectedGame.imageUrl
            };
            const newTournamentId = await addTournament(newTournamentData);
            const newTournament: Tournament = {
                id: newTournamentId,
                ...values,
                gameName: selectedGame.name,
                gameImageUrl: selectedGame.imageUrl,
                startTime: values.startTime,
                status: 'upcoming',
                playersJoined: 0,
                joinedUsers: []
            };
            setTournaments(ts => [...ts, newTournament]);
            toast({ title: "Tournament Added" });
        }
        setIsFormDialogOpen(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Operation Failed", description: error.message || "An unexpected error occurred." });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const handleChangeStatus = async (tournament: Tournament, status: TournamentStatus) => {
    setSelectedTournament(tournament);
    if (status === 'ongoing') {
        setIsRoomIdDialogOpen(true);
    } else if (status === 'completed') {
        setIsSubmitting(true);
        const participants = await getTournamentParticipants(tournament.id);
        const updatedTournament = { ...tournament, joinedUsers: participants };
        setSelectedTournament(updatedTournament);
        const initialResults = participants.map(() => ({ rank: 0, kills: 0, prize: 0 }));
        setResults(initialResults);
        setIsSubmitting(false);
        setIsResultsDialogOpen(true);
    } else if (status === 'cancelled') {
        setIsCancelDialogOpen(true);
    }
  }

  const handleConfirmSetOngoing = async () => {
    if (!selectedTournament || !roomId) {
      toast({ variant: "destructive", title: "Error", description: "Room ID is required." })
      return
    }
    setIsSubmitting(true);
    try {
      await updateTournament(selectedTournament.id, { status: 'ongoing', roomId, roomPassword });
      updateTournamentState(selectedTournament.id, { status: 'ongoing', roomId, roomPassword })
      toast({ title: "Tournament Started", description: "Room ID and password have been set." })
      setIsRoomIdDialogOpen(false)
      setRoomId('')
      setRoomPassword('')
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleConfirmCancel = async () => {
    if (!selectedTournament) return
    setIsSubmitting(true);
    try {
        // In a real app, this would be a cloud function that also refunds users.
        await updateTournament(selectedTournament.id, { status: 'cancelled' });
        updateTournamentState(selectedTournament.id, { status: 'cancelled' })
        toast({ title: "Tournament Cancelled", description: "Entry fees should be refunded manually." })
        setIsCancelDialogOpen(false)
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleResultChange = (index: number, field: keyof ResultInput, value: string) => {
    const newResults = [...results]
    newResults[index] = { ...newResults[index], [field]: Number(value) }
    setResults(newResults)
  }

  const handleConfirmEnterResults = async () => {
    if (!selectedTournament || !selectedTournament.joinedUsers) return
    setIsSubmitting(true);
    const finalResults: TournamentResult[] = selectedTournament.joinedUsers.map((user, index) => ({
        ...user,
        ...results[index],
        playerId: user.id
    }));
    try {
        await submitTournamentResults(selectedTournament.id, selectedTournament.name, finalResults);
        updateTournamentState(selectedTournament.id, { results: finalResults, status: 'completed' });
        toast({ title: "Results Submitted", description: "Winnings have been distributed to the players' wallets." });
        setIsResultsDialogOpen(false);
    } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleViewJoinedUsers = async (tournament: Tournament) => {
    setIsSubmitting(true);
    const participants = await getTournamentParticipants(tournament.id);
    const updatedTournament = { ...tournament, joinedUsers: participants };
    setSelectedTournament(updatedTournament);
    setIsSubmitting(false);
    setIsUsersDialogOpen(true);
  }

  const handleEnterResults = async (tournament: Tournament) => {
    setIsSubmitting(true);
    const participants = await getTournamentParticipants(tournament.id);
    const updatedTournament = { ...tournament, joinedUsers: participants };
    setSelectedTournament(updatedTournament);
    const initialResults = participants.map(() => ({ rank: 0, kills: 0, prize: 0 }));
    setResults(initialResults);
    setIsSubmitting(false);
    setIsResultsDialogOpen(true);
  }

  const handleViewResults = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setIsViewResultsDialogOpen(true)
  }
  
  const columns = getColumns({
    onEdit: handleOpenFormDialog,
    onDelete: handleDeleteTournament,
    onChangeStatus: handleChangeStatus,
    onEnterResults: handleEnterResults,
    onViewResults: handleViewResults,
    onViewJoinedUsers: handleViewJoinedUsers,
  })

  return (
    <>
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenFormDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingTournament ? "Edit Tournament" : "Create New Tournament"}</DialogTitle>
                <DialogDescription>
                  {editingTournament ? "Update the details of the tournament." : "Fill in the details for the new tournament."}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 px-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning Mayhem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a game" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {games.map(game => (
                            <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="teamType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a team type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="solo">Solo</SelectItem>
                           <SelectItem value="duo">Duo</SelectItem>
                           <SelectItem value="squad">Squad</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Players</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prizePool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Prize Pool (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="perKillReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Per Kill Reward (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="prizeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., 1st: ₹1000, 2nd: ₹500..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="map"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Map</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Erangel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Battle Royale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Rules</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter tournament rules..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              </ScrollArea>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTournament ? "Save Changes" : "Create Tournament"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Action Dialogs */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will need to manually refund entry fees to all joined players.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRoomIdDialogOpen} onOpenChange={setIsRoomIdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Tournament: {selectedTournament?.name}</DialogTitle>
            <DialogDescription>Enter the Room ID and Password. This will be shown to joined players.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomId" className="text-right">Room ID</Label>
              <Input id="roomId" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomPassword" className="text-right">Password</Label>
              <div className="col-span-3 relative">
                <Input id="roomPassword" type={showPassword ? "text" : "password"} value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomIdDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleConfirmSetOngoing} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set & Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Joined Users - {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player/Team Leader</TableHead>
                  <TableHead>Team Members</TableHead>
                  <TableHead>Join Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTournament?.joinedUsers?.length ? selectedTournament.joinedUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>{user.inGameName}</div>
                      <div className="text-xs text-muted-foreground">{user.name} ({user.email})</div>
                    </TableCell>
                    <TableCell>
                      {user.teamMembers && user.teamMembers.length > 1 ? (
                        <ul className="list-disc pl-4 text-xs text-muted-foreground">
                          {user.teamMembers.slice(1).map((tm, i) => <li key={i}>{tm.inGameName}</li>)}
                        </ul>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{format(user.joinTime instanceof Date ? user.joinTime : user.joinTime.toDate(), "PPp")}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="h-24 text-center">No users have joined yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader><DialogTitle>Enter Results - {selectedTournament?.name}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Player</TableHead>
                  <TableHead>In-Game Name</TableHead>
                  <TableHead className="w-[100px]">Rank</TableHead>
                  <TableHead className="w-[100px]">Kills</TableHead>
                  <TableHead className="w-[120px]">Prize</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTournament?.joinedUsers?.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.inGameName}</TableCell>
                    <TableCell><Input type="number" value={results[index]?.rank} onChange={(e) => handleResultChange(index, 'rank', e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={results[index]?.kills} onChange={(e) => handleResultChange(index, 'kills', e.target.value)} /></TableCell>
                    <TableCell><Input type="number" value={results[index]?.prize} onChange={(e) => handleResultChange(index, 'prize', e.target.value)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleConfirmEnterResults} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewResultsDialogOpen} onOpenChange={setIsViewResultsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>View Results - {selectedTournament?.name}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Kills</TableHead>
                  <TableHead>Prize</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTournament?.results?.sort((a, b) => a.rank - b.rank).map(result => (
                  <TableRow key={result.playerId}>
                    <TableCell className="font-bold">{result.rank}</TableCell>
                    <TableCell>
                      <div>{result.name}</div>
                      <div className="text-xs text-muted-foreground">{result.inGameName}</div>
                    </TableCell>
                    <TableCell>{result.kills}</TableCell>
                    <TableCell>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(result.prize)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
           <DialogFooter>
             <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4">
        <DataTable columns={columns} data={tournaments} />
      </div>
    </>
  )
}
