
"use client";

import Image from "next/image";
import Link from "next/link";

type Game = {
  id: string;
  name: string;
  tournamentCount?: number;
  imageUrl: string;
  hint?: string;
};

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/tournaments/${game.id}`} className="group block">
      <div className="overflow-hidden rounded-lg bg-card text-card-foreground shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <Image
          src={game.imageUrl}
          alt={game.name}
          width={200}
          height={200}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={game.hint}
        />
      </div>
    </Link>
  );
}
