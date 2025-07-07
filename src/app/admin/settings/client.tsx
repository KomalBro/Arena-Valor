"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { type AppSettings } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const settingsFormSchema = z.object({
    appName: z.string().min(1, "App Name is required."),
    logoUrl: z.string().url("Must be a valid URL."),
    upiAddress: z.string().min(1, "UPI Address is required."),
    supportContact: z.string().min(1, "Support Contact is required."),
    minWithdrawal: z.coerce.number().min(0, "Must be a positive number."),
    referralBonus: z.coerce.number().min(0, "Must be a positive number."),
    privacyPolicy: z.string().min(1, "Privacy Policy is required."),
    refundPolicy: z.string().min(1, "Refund Policy is required."),
    termsOfUse: z.string().min(1, "Terms of Use are required."),
    fairPlayPolicy: z.string().min(1, "Fair Play Policy is required."),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

interface SettingsClientProps {
  initialSettings: AppSettings
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { toast } = useToast()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: initialSettings,
  })

  const onSubmit = (values: SettingsFormValues) => {
    // In a real app, this would be an API call
    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated successfully.",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Update your application's name, logo, and support contact.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="appName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>App Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="logoUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>App Logo URL</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="supportContact" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Support Contact (WhatsApp)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Settings</CardTitle>
                        <CardDescription>Manage payment details, withdrawal limits, and bonuses.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField control={form.control} name="upiAddress" render={({ field }) => (
                            <FormItem>
                                <FormLabel>UPI Payment Address</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormDescription>The UPI ID where users should send payments.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="minWithdrawal" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Minimum Withdrawal Amount (INR)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="referralBonus" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Referral Bonus (INR)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Policy Texts</CardTitle>
                        <CardDescription>Update the legal and policy documents for your app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField control={form.control} name="termsOfUse" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Terms of Use</FormLabel>
                                <FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="privacyPolicy" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Privacy Policy</FormLabel>
                                <FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="refundPolicy" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Refund Policy</FormLabel>
                                <FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="fairPlayPolicy" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fair Play Policy</FormLabel>
                                <FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
