
"use client"

import { useEffect, useState, useRef } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getSupportTicket, onSupportTicketMessagesSnapshot, addSupportMessage, updateSupportTicketStatus } from "@/lib/firebase/firestore";
import type { SupportTicket, SupportMessage } from "@/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send, CheckCircle, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function AdminSupportTicketPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSolving, setIsSolving] = useState(false);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });
  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicket = async () => {
      setLoading(true);
      const ticketData = await getSupportTicket(ticketId);
      if (!ticketData) {
        notFound();
        return;
      }
      setTicket(ticketData);
      setLoading(false);
    };

    fetchTicket();

    const unsubscribe = onSupportTicketMessagesSnapshot(ticketId, setMessages);
    return () => unsubscribe();
  }, [ticketId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleMarkAsSolved = async () => {
      if (!ticket) return;
      setIsSolving(true);
      try {
          await updateSupportTicketStatus(ticket.id, 'solved');
          setTicket(prev => prev ? {...prev, status: 'solved'} : null);
          toast({ title: "Ticket Marked as Solved" });
      } catch (error: any) {
          toast({ variant: "destructive", title: "Update Failed", description: error.message });
      } finally {
          setIsSolving(false);
      }
  };

  const onSubmit = async (data: MessageFormValues) => {
    if (!user || !ticket) return;
    try {
      await addSupportMessage(ticket.id, {
        senderId: user.uid,
        senderType: 'admin',
        message: data.message,
      });
      form.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Send Failed", description: error.message });
    }
  };

  if (loading) {
    return <TicketSkeleton />;
  }

  if (!ticket) {
    return notFound();
  }
  
  const statusVariant: "default" | "secondary" = ticket.status === 'solved' ? 'default' : 'secondary';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Button asChild variant="outline" size="sm">
                <Link href="/admin/support">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Tickets
                </Link>
            </Button>

            <Card className="flex flex-col h-[75vh]">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-2xl">{ticket.issueType}</CardTitle>
                            <CardDescription>
                                Ticket from {ticket.userName}
                            </CardDescription>
                        </div>
                        <Badge variant={statusVariant} className="capitalize">{ticket.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-0">
                <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {messages.map(msg => {
                            const isAdmin = msg.senderType === 'admin';
                            return (
                                <div key={msg.id} className={cn("flex items-start gap-4", isAdmin ? "justify-end" : "justify-start")}>
                                    {!isAdmin && <Avatar><AvatarFallback>{ticket.userName.charAt(0)}</AvatarFallback></Avatar>}
                                    <div className={cn("flex-1 space-y-2", isAdmin && "text-right")}>
                                        <div className={cn("p-3 rounded-lg inline-block max-w-sm", isAdmin ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                                            <p className="font-bold">{isAdmin ? "Support Team" : ticket.userName}</p>
                                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{format(msg.timestamp, "h:mm a")}</p>
                                    </div>
                                    {isAdmin && <Avatar><AvatarFallback>A</AvatarFallback></Avatar>}
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
                </CardContent>
                {ticket.status === 'open' && (
                    <CardFooter className="p-4 border-t">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center gap-2">
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                <Textarea placeholder="Type your reply..." {...field} className="min-h-0 resize-none" rows={1} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                        </form>
                    </Form>
                    </CardFooter>
                )}
            </Card>
        </div>
         <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">User:</span>
                        <span className="font-medium">{ticket.userName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{ticket.userEmail}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Opened:</span>
                        <span className="font-medium">{format(ticket.createdAt, 'PP')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update:</span>
                        <span className="font-medium">{format(ticket.updatedAt, 'PPp')}</span>
                    </div>
                </CardContent>
            </Card>
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Initial User Message</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{ticket.description}</AlertDescription>
            </Alert>
            {ticket.status === 'open' && (
                <Button className="w-full" onClick={handleMarkAsSolved} disabled={isSolving}>
                    {isSolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Mark as Solved
                </Button>
            )}
        </div>
    </div>
  );
}

const TicketSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-[75vh] w-full" />
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    </div>
)
