"use client"

import { type ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal, Pencil, Trash2, FilePen, BarChart, XCircle, Play, Trophy, VenetianMask, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { type Tournament, type TournamentStatus } from "@/types"
import { Badge } from "@/components/ui/badge"

const statusVariantMap: Record<TournamentStatus, "default" | "secondary" | "destructive" | "outline"> = {
    upcoming: "secondary",
    ongoing: "default",
    completed: "outline",
    cancelled: "destructive",
}

type ActionsCallbacks = {
    onEdit: (tournament: Tournament) => void;
    onDelete: (tournamentId: string) => void;
    onChangeStatus: (tournament: Tournament, status: TournamentStatus) => void;
    onEnterResults: (tournament: Tournament) => void;
    onViewResults: (tournament: Tournament) => void;
    onViewJoinedUsers: (tournament: Tournament) => void;
};


export const getColumns = (callbacks: ActionsCallbacks): ColumnDef<Tournament>[] => [
  {
    accessorKey: "name",
    header: "Tournament",
    cell: ({ row }) => {
      const tournament = row.original
      return (
        <div className="flex items-center gap-4">
          <Image
            src={tournament.gameImageUrl || `https://placehold.co/60x60.png`}
            alt={tournament.gameName || 'Game Image'}
            width={60}
            height={60}
            className="rounded-md object-cover"
          />
          <div>
            <div className="font-medium">{tournament.name}</div>
            <div className="text-sm text-muted-foreground">{tournament.gameName}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.original.status
        return <Badge variant={statusVariantMap[status]} className="capitalize">{status}</Badge>
    }
  },
  {
    accessorKey: "timings",
    header: "Timings",
    cell: ({ row }) => {
        const date = row.original.startTime;
        const formattedDate = date.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
        });
        const formattedTime = date.toISOString().slice(11, 16);
        return (
            <div>
                <div className="text-sm">{formattedDate}</div>
                <div className="text-xs text-muted-foreground">{formattedTime}</div>
            </div>
        )
    }
  },
   {
    accessorKey: "prizePool",
    header: "Prize Pool",
    cell: ({ row }) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.prizePool)
    }
  },
  {
    accessorKey: "entryFee",
    header: "Entry Fee",
     cell: ({ row }) => {
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.original.entryFee)
    }
  },
  {
    accessorKey: "players",
    header: "Players",
    cell: ({ row }) => {
        const { playersJoined, maxPlayers } = row.original;
        return <Badge variant="secondary">{`${playersJoined} / ${maxPlayers}`}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const tournament = row.original
      const { status } = tournament;

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
              
              {status !== 'cancelled' && (
                  <DropdownMenuItem onClick={() => callbacks.onViewJoinedUsers(tournament)}>
                      <Users className="mr-2 h-4 w-4" />
                      View Joined Users
                  </DropdownMenuItem>
              )}

              {status === 'upcoming' && (
                  <DropdownMenuItem onClick={() => callbacks.onEdit(tournament)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                  </DropdownMenuItem>
              )}

              {(status === 'upcoming' || status === 'ongoing') && <DropdownMenuSeparator />}

              {(status === 'upcoming' || status === 'ongoing') && (
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                          <FilePen className="mr-2 h-4 w-4" />
                          <span>Change Status</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                              {status === 'upcoming' && (
                                  <>
                                      <DropdownMenuItem onClick={() => callbacks.onChangeStatus(tournament, 'ongoing')}>
                                          <Play className="mr-2 h-4 w-4" />
                                          Start (Ongoing)
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => callbacks.onChangeStatus(tournament, 'cancelled')}>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Cancel
                                      </DropdownMenuItem>
                                  </>
                              )}
                              {status === 'ongoing' && (
                                  <>
                                      <DropdownMenuItem onClick={() => callbacks.onChangeStatus(tournament, 'completed')}>
                                          <Trophy className="mr-2 h-4 w-4" />
                                          Mark as Completed
                                      </DropdownMenuItem>
                                       <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => callbacks.onChangeStatus(tournament, 'cancelled')}>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Cancel
                                      </DropdownMenuItem>
                                  </>
                              )}
                          </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                  </DropdownMenuSub>
              )}

              {status === 'completed' && (
                  <>
                      {tournament.results ? (
                          <DropdownMenuItem onClick={() => callbacks.onViewResults(tournament)}>
                              <BarChart className="mr-2 h-4 w-4" />
                              View Results
                          </DropdownMenuItem>
                      ) : (
                          <DropdownMenuItem onClick={() => callbacks.onEnterResults(tournament)}>
                              <VenetianMask className="mr-2 h-4 w-4" />
                              Enter Results
                          </DropdownMenuItem>
                      )}
                  </>
              )}
             
              {(status === 'completed' || status === 'cancelled') && (
                  <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => callbacks.onDelete(tournament.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                      </DropdownMenuItem>
                  </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
