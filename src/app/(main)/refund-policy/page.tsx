import { appSettings } from "@/lib/mock-data";

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Refund Policy
      </h1>
      <div className="prose prose-lg mt-8 max-w-none text-muted-foreground">
        <p className="whitespace-pre-wrap">{appSettings.refundPolicy}</p>
      </div>
    </div>
  );
}
