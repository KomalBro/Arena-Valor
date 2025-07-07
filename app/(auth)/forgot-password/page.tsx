"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Logo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);

    if (!auth) {
      toast({
        variant: "destructive",
        title: "Setup Incomplete",
        description: "Firebase is not configured. Please add your credentials to a .env.local file.",
      });
      setLoading(false);
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Check Your Email",
        description: "A password reset link has been sent to your email address.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl">Forgot Your Password?</CardTitle>
        <CardDescription>
          No worries! Enter your email and we'll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input id="email" type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <Link href="/login" className="flex items-center font-medium text-accent hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
