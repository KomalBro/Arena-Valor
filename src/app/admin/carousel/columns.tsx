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
import { type CarouselSlide } from "@/types"

export const getColumns = (
    onEdit: (slide: CarouselSlide) => void,
    onDelete: (slideId: string) => void
): ColumnDef<CarouselSlide>[] => [
  {
    accessorKey: "title",
    header: "Slide",
    cell: ({ row }) => {
      const slide = row.original
      return (
        <div className="flex items-center gap-4">
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            width={120}
            height={48}
            className="rounded-md object-cover"
          />
          <div>
            <span className="font-medium">{slide.title}</span>
            <p className="text-sm text-muted-foreground truncate max-w-xs">{slide.description}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "hint",
    header: "AI Hint",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const slide = row.original

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
              <DropdownMenuItem onClick={() => onEdit(slide)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => onDelete(slide.id)}>
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
