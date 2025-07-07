
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { createSupportTicket } from "@/lib/firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import type { SupportTicket } from "@/types";

const newTicketSchema = z.object({
  issueType: z.enum(['Wallet Issue', 'Match Issue', 'Result Issue', 'App Bug', 'Other'], {
    required_error: "You need to select an issue type.",
  }),
  description: z.string().min(20, { message: "Please provide a detailed description (at least 20 characters)." }),
});

type NewTicketFormValues = z.infer<typeof newTicketSchema>;

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<NewTicketFormValues>({
    resolver: zodResolver(newTicketSchema),
  });

  const onSubmit = async (data: NewTicketFormValues) => {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a ticket." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        userId: user.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        issueType: data.issueType,
        description: data.description,
      };
      
      const newTicketId = await createSupportTicket(ticketData);
      toast({ title: "Ticket Created", description: "Our support team will get back to you shortly." });
      router.push(`/support/${newTicketId}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message || "An unexpected error occurred." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link href="/support">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Tickets
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create a New Support Ticket</CardTitle>
          <CardDescription>Describe your issue, and we'll help you resolve it.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your issue about?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Wallet Issue">Wallet Issue</SelectItem>
                        <SelectItem value="Match Issue">Match Issue</SelectItem>
                        <SelectItem value="Result Issue">Result Issue</SelectItem>
                        <SelectItem value="App Bug">App Bug</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Please describe the issue in detail</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us what happened, including any relevant match IDs or transaction details."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
