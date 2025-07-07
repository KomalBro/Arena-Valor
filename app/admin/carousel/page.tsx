import { CarouselClient } from "./client";
import { getCarouselSlides } from "@/lib/firebase/firestore";

export default async function ManageCarouselPage() {
    const slides = await getCarouselSlides();

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Manage Carousel
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
                Add, edit, or delete slides from the main dashboard carousel.
            </p>
            <div className="mt-8">
                <CarouselClient initialSlides={slides} />
            </div>
        </div>
    );
}
