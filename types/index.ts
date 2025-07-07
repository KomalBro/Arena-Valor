

import type { Timestamp } from "firebase/firestore";

export type Game = {
    id: string;
    name: string;
    imageUrl: string;
    tournamentCount?: number;
    hint?: string;
};

export type CarouselSlide = {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    hint: string;
};

export type TournamentStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type TeamType = 'solo' | 'duo' | 'squad';

export type Player = {
    id: string; // user.uid
    name: string; // user's profile name
    email: string;
    inGameName: string; // Team leader's in-game name or solo player's name
    teamMembers?: { inGameName: string }[]; // For duo/squad
    joinTime: Date | Timestamp;
};

export type TournamentResult = {
    playerId: string; // user.uid of team leader
    rank: number;
    kills: number;
    prize: number;
} & Omit<Player, 'id'>;

export type Tournament = {
    id: string;
    name: string;
    gameId: string;
    gameName: string;
    gameImageUrl: string;
    entryFee: number;
    prizePool: number;
    prizeDescription?: string;
    perKillReward: number;
    startTime: Date | Timestamp;
    status: TournamentStatus;
    playersJoined: number;
    maxPlayers: number;
    map?: string;
    mode?: string;
    teamType: TeamType;
    rules?: string;
    roomId?: string;
    roomPassword?: string;
    // This will now be dynamically fetched from a subcollection
    joinedUsers?: Player[]; 
    results?: TournamentResult[];
};

export type AppSettings = {
    appName: string;
    logoUrl: string;
    upiAddress: string;
    supportContact: string;
    minWithdrawal: number;
    referralBonus: number;
    privacyPolicy: string;
    refundPolicy: string;
    termsOfUse: string;
    fairPlayPolicy: string;
};

export type WithdrawalStatus = 'pending' | 'completed' | 'rejected';

export type WithdrawalRequest = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    upiId: string;
    status: WithdrawalStatus;
    requestDate: Date | Timestamp;
    processedDate?: Date | Timestamp;
};

export type Transaction = {
    id:string;
    type: 'deposit' | 'withdrawal' | 'join_fee' | 'prize' | 'refund' | 'admin_credit' | 'admin_debit';
    description: string;
    amount: number;
    date: Date | Timestamp;
};

export type UserProfile = {
    id: string;
    name: string; // Full name for display
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    mobileNumber: string;
    profilePhotoUrl: string;
    tournamentsPlayed: number;
    wins: number;
    totalEarnings: number;
    depositBalance: number;
    winningsBalance: number;
    role?: 'admin' | 'user';
    status: 'active' | 'banned';
    referralCode: string;
    referredBy?: string; // Code of the user who referred this person
    createdAt: Date | Timestamp;
};

export type SupportTicketStatus = 'open' | 'solved';
export type SenderType = 'user' | 'admin';

export type SupportTicket = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    issueType: 'Wallet Issue' | 'Match Issue' | 'Result Issue' | 'App Bug' | 'Other';
    description: string;
    status: SupportTicketStatus;
    createdAt: Date;
    updatedAt: Date;
    tournamentId?: string;
    tournamentName?: string;
};

export type SupportMessage = {
    id: string;
    senderId: string;
    senderType: SenderType;
    message: string;
    timestamp: Date;
};

export type PendingReferral = {
    id?: string; // Document ID
    newUserId: string;
    referrerCode: string;
    createdAt: Date | Timestamp;
    processed: boolean;
};
