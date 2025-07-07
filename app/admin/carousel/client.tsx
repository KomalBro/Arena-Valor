"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, PlusCircle } from "lucide-react"
import { addCarouselSlide, deleteCarouselSlide, updateCarouselSlide } from "@/lib/firebase/firestore"

import { type CarouselSlide } from "@/types"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface CarouselClientProps {
  initialSlides: CarouselSlide[]
}

const slideFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  imageUrl: z.string().url("Please enter a valid image URL."),
  hint: z.string().min(2, "Hint must be at least 2 characters."),
})

type SlideFormValues = z.infer<typeof slideFormSchema>

export function CarouselClient({ initialSlides }: CarouselClientProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null)
  const { toast } = useToast()

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      hint: "",
    },
  })

  const handleOpenDialog = (slide: CarouselSlide | null = null) => {
    setEditingSlide(slide)
    if (slide) {
      form.reset(slide)
    } else {
      form.reset({ title: "", description: "", imageUrl: "", hint: "" })
    }
    setIsDialogOpen(true)
  }

  const handleDeleteSlide = async (slideId: string) => {
    try {
      await deleteCarouselSlide(slideId)
      setSlides(slides.filter((s) => s.id !== slideId))
      toast({
        variant: "destructive",
        title: "Slide Deleted",
        description: "The carousel slide has been successfully deleted.",
      })
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error Deleting Slide",
        description: error.message || "An unexpected error occurred.",
      })
    }
  }
  
  const onSubmit = async (values: SlideFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingSlide) {
        await updateCarouselSlide(editingSlide.id, values)
        setSlides(
          slides.map((s) =>
            s.id === editingSlide.id ? { ...s, ...values } : s
          )
        )
        toast({
          title: "Slide Updated",
          description: "The slide has been successfully updated.",
        })
      } else {
        const newSlideId = await addCarouselSlide(values)
        const newSlide: CarouselSlide = { id: newSlideId, ...values }
        setSlides([...slides, newSlide])
        toast({
          title: "Slide Added",
          description: "The new slide has been successfully added to the carousel.",
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

  const columns = getColumns(handleOpenDialog, handleDeleteSlide)

  return (
    <>
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Slide
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingSlide ? "Edit Slide" : "Add New Slide"}</DialogTitle>
                <DialogDescription>
                  {editingSlide 
                    ? "Update the details of the carousel slide." 
                    : "Fill in the details for the new slide."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BATTLEMANIA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter a short description for the slide." {...field} />
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
                        <Input placeholder="https://placehold.co/1000x400.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Image Hint</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., esports battle" {...field} />
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
                  {editingSlide ? "Save Changes" : "Add Slide"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <div className="mt-4">
        <DataTable columns={columns} data={slides} />
      </div>
    </>
  )
}
