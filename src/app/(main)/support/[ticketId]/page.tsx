
"use client"

import { useEffect, useState, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getSupportTicket, onSupportTicketMessagesSnapshot, addSupportMessage } from "@/lib/firebase/firestore";
import type { SupportTicket, SupportMessage, SenderType } from "@/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function SupportTicketPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });
  const {formState: { isSubmitting } } = form;

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicket = async () => {
      setLoading(true);
      const ticketData = await getSupportTicket(ticketId);
      if (!ticketData || (user && ticketData.userId !== user.uid)) {
        notFound();
        return;
      }
      setTicket(ticketData);
      setLoading(false);
    };

    fetchTicket();

    const unsubscribe = onSupportTicketMessagesSnapshot(ticketId, setMessages);
    return () => unsubscribe();
  }, [ticketId, user]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const onSubmit = async (data: MessageFormValues) => {
    if (!user || !ticket) return;
    try {
      await addSupportMessage(ticket.id, {
        senderId: user.uid,
        senderType: 'user',
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
  
  const statusVariant: "default" | "secondary" | "destructive" = ticket.status === 'solved' ? 'default' : 'secondary';

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link href="/support">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Tickets
        </Link>
      </Button>

      <Card className="flex flex-col h-[75vh]">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-2xl">{ticket.issueType}</CardTitle>
                <CardDescription>
                    Ticket opened {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                </CardDescription>
            </div>
            <Badge variant={statusVariant} className="capitalize">{ticket.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
                {/* Initial message */}
                <div className="flex items-start gap-4">
                     <Avatar><AvatarFallback>{ticket.userName.charAt(0)}</AvatarFallback></Avatar>
                     <div className="flex-1 space-y-2">
                        <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                            <p className="font-bold">{ticket.userName}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                        </div>
                         <p className="text-xs text-muted-foreground">{format(ticket.createdAt, "MMM d, yyyy 'at' h:mm a")}</p>
                     </div>
                </div>
                {/* Chat messages */}
                {messages.map(msg => {
                    const isUser = msg.senderType === 'user';
                    return (
                        <div key={msg.id} className={cn("flex items-start gap-4", isUser ? "justify-end" : "justify-start")}>
                             {!isUser && <Avatar><AvatarFallback>A</AvatarFallback></Avatar>}
                             <div className={cn("flex-1 space-y-2", isUser && "text-right")}>
                                <div className={cn("p-3 rounded-lg inline-block max-w-sm", isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                                    <p className="font-bold">{isUser ? userProfile?.name : "Support Team"}</p>
                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{format(msg.timestamp, "h:mm a")}</p>
                             </div>
                             {isUser && <Avatar><AvatarFallback>{userProfile?.name.charAt(0)}</AvatarFallback></Avatar>}
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
  );
}

const TicketSkeleton = () => (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-40 mb-4" />
        <Card className="h-[75vh]">
            <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-2" /></CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-16 w-full" /><Skeleton className="h-4 w-1/4" /></div></div>
                <div className="flex flex-row-reverse gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-12 w-full" /><Skeleton className="h-4 w-1/4 ml-auto" /></div></div>
            </CardContent>
            <CardFooter className="p-4 border-t"><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
    </div>
)
