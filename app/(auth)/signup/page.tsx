
"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/firebase/firestore";

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
import { Loader2 } from "lucide-react";

const signupSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  mobileNumber: z.string().length(10, { message: "Please enter a valid 10-digit mobile number." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  referralCode: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", username: "", email: "", mobileNumber: "", password: "", referralCode: "" },
  });

  const onSubmit = async (data: SignupFormValues) => {
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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Create a corresponding user document in Firestore, now with referral logic
      await createUserProfile(user, {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        mobileNumber: data.mobileNumber,
        referralCode: data.referralCode, // Pass the referral code from the form
      });

      // The auth context and layout will handle the redirect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
        <CardDescription>Join the arena and start competing today!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <Label>First Name</Label>
                    <FormControl>
                      <Input type="text" placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Last Name</Label>
                    <FormControl>
                      <Input type="text" placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <Label>Username</Label>
                  <FormControl>
                    <Input type="text" placeholder="johndoe123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <Label>Mobile Number</Label>
                  <FormControl>
                    <Input type="tel" placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label>Email</Label>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label>Password</Label>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <Label>Referral Code (Optional)</Label>
                    <FormControl>
                      <Input type="text" placeholder="Got a code?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?&nbsp;
          <Link href="/login" className="font-medium text-accent hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
