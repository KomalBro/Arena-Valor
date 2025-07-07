
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { DollarSign, Edit, Gamepad2, Trophy, Loader2, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/lib/firebase/firestore";
import type { UserProfile } from "@/types";
import { appSettings } from "@/lib/mock-data";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().min(2, "Last name is required."),
  username: z.string().min(3, "Username is required."),
  mobileNumber: z.string().length(10, "Must be a 10-digit number."),
  profilePhotoUrl: z.string().url("Must be a valid URL.").or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function EditProfileDialog({ userProfile, open, onOpenChange }: { userProfile: UserProfile, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: userProfile.firstName ?? "",
            lastName: userProfile.lastName ?? "",
            username: userProfile.username ?? "",
            mobileNumber: userProfile.mobileNumber ?? "",
            profilePhotoUrl: userProfile.profilePhotoUrl ?? "",
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(userProfile.id, data);
            toast({
                title: "Profile Updated",
                description: "Your profile information has been successfully updated.",
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>
                                Make changes to your profile here. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                         <FormField control={form.control} name="username" render={({ field }) => (
                            <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                            <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="profilePhotoUrl" render={({ field }) => (
                            <FormItem><FormLabel>Profile Photo URL</FormLabel><FormControl><Input placeholder="https://example.com/avatar.png" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function ProfilePage() {
    const { user, userProfile, loading } = useAuth();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { toast } = useToast();
    
    if (loading || !user || !userProfile) {
        return <ProfileSkeleton />;
    }

    const displayName = userProfile.name || user.email?.split('@')[0] || "User";
    const fallback = displayName.charAt(0).toUpperCase();

    const stats = [
        { title: "Tournaments Played", value: userProfile.tournamentsPlayed, icon: <Gamepad2 className="h-6 w-6 text-muted-foreground" /> },
        { title: "Total Wins", value: userProfile.wins, icon: <Trophy className="h-6 w-6 text-muted-foreground" /> },
        { title: "Total Earnings", value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(userProfile.totalEarnings), icon: <DollarSign className="h-6 w-6 text-muted-foreground" /> },
    ];

    const handleCopy = () => {
        if (userProfile.referralCode) {
            navigator.clipboard.writeText(userProfile.referralCode);
            toast({ title: "Copied!", description: "Referral code copied to clipboard." });
        }
    };

    return (
        <>
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader className="flex flex-col sm:flex-row items-center gap-6 p-6">
                       <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarImage src={userProfile.profilePhotoUrl || user.photoURL || `https://placehold.co/100x100.png`} alt={displayName} data-ai-hint="user avatar" />
                            <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left flex-grow">
                            <CardTitle className="font-headline text-3xl">{displayName}</CardTitle>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                         <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                         </Button>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                         <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                            {stats.map(stat => (
                                <Card key={stat.title} className="text-center">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {stat.title}
                                        </CardTitle>
                                        {stat.icon}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Your Referral Code</h3>
                            <p className="text-muted-foreground text-sm mb-2">
                                Share this code with friends! When they sign up, you both get a bonus of {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(appSettings.referralBonus)}.
                            </p>
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                                <p className="text-2xl font-bold tracking-widest text-primary flex-grow font-mono">{userProfile.referralCode}</p>
                                <Button onClick={handleCopy} size="sm"><Copy className="mr-2 h-4 w-4" />Copy</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <EditProfileDialog userProfile={userProfile} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
        </>
    );
}

const ProfileSkeleton = () => (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto">
            <CardHeader className="flex flex-col sm:flex-row items-center gap-6 p-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="text-center sm:text-left flex-grow space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
                <div className="mt-8 border-t pt-6">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                     <Skeleton className="h-14 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
);
