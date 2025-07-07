
import { getGames, getCarouselSlides } from "@/lib/firebase/firestore";
import { type Game, type CarouselSlide } from "@/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { GameCard } from "@/components/game-card";

export default async function DashboardPage() {
    const games: Game[] = await getGames();
    const carouselSlides: CarouselSlide[] = await getCarouselSlides();

    return (
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="sr-only">Game Browser</h1>
            
            {carouselSlides.length > 0 && (
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full mb-12"
                >
                    <CarouselContent>
                        {carouselSlides.map((slide) => (
                            <CarouselItem key={slide.id}>
                                <Card className="relative overflow-hidden rounded-xl">
                                    <Image
                                        src={slide.imageUrl}
                                        alt={slide.title}
                                        width={1000}
                                        height={400}
                                        className="w-full aspect-[2.5/1] object-cover"
                                        data-ai-hint={slide.hint}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 md:p-8">
                                        <h2 className="font-headline text-2xl md:text-4xl font-bold text-white">{slide.title}</h2>
                                        <p className="text-white/80 mt-2 max-w-lg text-sm md:text-base">{slide.description}</p>
                                    </div>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex left-4" />
                    <CarouselNext className="hidden sm:flex right-4" />
                </Carousel>
            )}

            <div className="mb-8 text-center">
                 <h2 className="font-headline text-2xl font-bold text-foreground">All Games</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {games.map(game => (
                    <GameCard key={game.id} game={game} />
                ))}
            </div>
        </div>
    )
}
