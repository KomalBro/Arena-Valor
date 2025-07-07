"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, PlusCircle } from "lucide-react"
import { addGame, deleteGame, updateGame } from "@/lib/firebase/firestore"

import { type Game } from "@/types"
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
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface GamesClientProps {
  initialGames: Game[]
}

const gameFormSchema = z.object({
  name: z.string().min(3, "Game name must be at least 3 characters."),
  imageUrl: z.string().url("Please enter a valid image URL."),
})

type GameFormValues = z.infer<typeof gameFormSchema>

export function GamesClient({ initialGames }: GamesClientProps) {
  const [games, setGames] = useState<Game[]>(initialGames)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const { toast } = useToast()

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  })

  const handleOpenDialog = (game: Game | null = null) => {
    setEditingGame(game)
    if (game) {
      form.reset({ name: game.name, imageUrl: game.imageUrl })
    } else {
      form.reset({ name: "", imageUrl: "" })
    }
    setIsDialogOpen(true)
  }

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame(gameId)
      setGames(games.filter((g) => g.id !== gameId))
      toast({
        variant: "destructive",
        title: "Game Deleted",
        description: "The game has been successfully deleted.",
      })
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error Deleting Game",
        description: error.message || "An unexpected error occurred.",
      })
    }
  }
  
  const onSubmit = async (values: GameFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingGame) {
        await updateGame(editingGame.id, values)
        setGames(
          games.map((g) =>
            g.id === editingGame.id ? { ...g, ...values } : g
          )
        )
        toast({
          title: "Game Updated",
          description: "The game has been successfully updated.",
        })
      } else {
        const newGameId = await addGame(values)
        const newGame: Game = {
          id: newGameId,
          ...values,
          tournamentCount: 0,
          hint: values.name.toLowerCase().replace(/\s/g, '_'),
        }
        setGames([...games, newGame])
        toast({
          title: "Game Added",
          description: "The new game has been successfully added.",
        })
      }
      setIsDialogOpen(false)
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Operation Failed",
            description: error.message || "An unexpected error occurred.",
        })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = getColumns(handleOpenDialog, handleDeleteGame)

  return (
    <>
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Game
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingGame ? "Edit Game" : "Add New Game"}</DialogTitle>
                <DialogDescription>
                  {editingGame 
                    ? "Update the details of the game." 
                    : "Fill in the details for the new game."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Free Fire MAX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://placehold.co/400x500.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingGame ? "Save Changes" : "Add Game"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <div className="mt-4">
        <DataTable columns={columns} data={games} />
      </div>
    </>
  )
}
