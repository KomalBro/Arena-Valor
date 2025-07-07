import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Trophy, DollarSign } from "lucide-react";

const stats = [
    { title: "Total Users", value: "12,543", icon: <Users className="h-6 w-6 text-muted-foreground" /> },
    { title: "Active Tournaments", value: "27", icon: <Trophy className="h-6 w-6 text-muted-foreground" /> },
    { title: "Games Supported", value: "6", icon: <Gamepad2 className="h-6 w-6 text-muted-foreground" /> },
    { title: "Total Winnings", value: "$89,241", icon: <DollarSign className="h-6 w-6 text-muted-foreground" /> },
]

export default function AdminDashboardPage() {
    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Admin Dashboard
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Overview of the Arena Valor platform.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.title}>
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

            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Activity feed will be displayed here.</p>
                        {/* Placeholder for a more complex component like a table or list */}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
