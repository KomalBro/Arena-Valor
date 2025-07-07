"use client"

import { type ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Game } from "@/types"
import { Badge } from "@/components/ui/badge"

export const getColumns = (
    onEdit: (game: Game) => void,
    onDelete: (gameId: string) => void
): ColumnDef<Game>[] => [
  {
    accessorKey: "name",
    header: "Game",
    cell: ({ row }) => {
      const game = row.original
      return (
        <div className="flex items-center gap-4">
          <Image
            src={game.imageUrl}
            alt={game.name}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
          <span className="font-medium">{game.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "tournamentCount",
    header: "Active Tournaments",
    cell: ({ row }) => {
        return <Badge variant="secondary">{row.original.tournamentCount ?? 0} Tournaments</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const game = row.original

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(game)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => onDelete(game.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
