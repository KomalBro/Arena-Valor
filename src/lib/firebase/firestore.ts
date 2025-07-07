

import { 
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    collection,
    collectionGroup,
    query,
    where,
    runTransaction,
    onSnapshot,
    type Unsubscribe,
    serverTimestamp,
    writeBatch,
    increment,
    orderBy
} from "firebase/firestore";
import { type User as AuthUser } from "firebase/auth";
import { db } from "@/lib/firebase";
import { type Game, type Tournament, type UserProfile, type Transaction, type Player, type TeamType, type CarouselSlide, type TournamentResult, type WithdrawalRequest, type SupportTicket, type SupportMessage, type SupportTicketStatus } from "@/types";
import { appSettings } from "@/lib/mock-data";

// --- Type Converters ---
// These helpers ensure that data fetched from Firestore (which uses Timestamps)
// is converted into a format our application can use (JS Date objects).

const userProfileConverter = {
    toFirestore: (profile: Omit<UserProfile, 'id'>) => profile,
    fromFirestore: (snapshot: any, options: any): UserProfile => {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        }
    }
};

const playerConverter = {
    toFirestore: (player: Player) => player,
    fromFirestore: (snapshot: any, options: any): Player => {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            joinTime: data.joinTime?.toDate ? data.joinTime.toDate() : new Date()
        }
    }
}

const gameConverter = {
    toFirestore: (game: Game) => game,
    fromFirestore: (snapshot: any, options: any): Game => {
        const data = snapshot.data(options);
        return { ...data, id: snapshot.id };
    }
};

const tournamentConverter = {
    toFirestore: (tournament: Tournament) => tournament,
    fromFirestore: (snapshot: any, options: any): Tournament => {
        const data = snapshot.data(options);
        // We initialize joinedUsers and results as empty arrays. They will be populated separately if needed.
        return {
            ...data,
            id: snapshot.id,
            startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(), // Convert Timestamp to Date
            joinedUsers: [],
            results: data.results?.map((result: any) => ({
                ...result,
                joinTime: result.joinTime?.toDate ? result.joinTime.toDate() : new Date()
            })) || []
        };
    }
};

const transactionConverter = {
    toFirestore: (transaction: Transaction) => transaction,
    fromFirestore: (snapshot: any, options: any): Transaction => {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            date: data.date?.toDate ? data.date.toDate() : new Date() // Convert Timestamp to Date
        };
    }
};

const carouselSlideConverter = {
    toFirestore: (slide: Omit<CarouselSlide, 'id'>) => slide,
    fromFirestore: (snapshot: any, options: any): CarouselSlide => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl,
            hint: data.hint,
        };
    }
};

const withdrawalRequestConverter = {
    toFirestore: (request: Omit<WithdrawalRequest, 'id'>) => request,
    fromFirestore: (snapshot: any, options: any): WithdrawalRequest => {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            requestDate: data.requestDate?.toDate ? data.requestDate.toDate() : new Date(),
            processedDate: data.processedDate?.toDate ? data.processedDate.toDate() : undefined
        };
    }
};

const supportTicketConverter = {
    toFirestore: (ticket: SupportTicket) => ticket,
    fromFirestore: (snapshot: any, options: any): SupportTicket => {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        }
    }
};

const supportMessageConverter = {
    toFirestore: (message: SupportMessage) => message,
    fromFirestore: (snapshot: any, options: any): SupportMessage => {
        const data = snapshot.data(options);
        return {
            ...data,
            id: snapshot.id,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        }
    }
};


// --- User Profile Functions ---

/**
 * Creates a new user profile document in Firestore. If a referral code is used,
 * it logs a pending referral for a backend process to handle securely.
 * @param user The Firebase Auth user object.
 * @param additionalData Additional data including an optional referral code.
 */
export async function createUserProfile(
    user: AuthUser, 
    additionalData: { 
        firstName: string; 
        lastName: string; 
        username: string; 
        mobileNumber: string;
        referralCode?: string; // This is the code the new user entered
    }
) {
    if (!db) throw new Error("Firestore is not initialized.");

    const newUserRef = doc(db, "users", user.uid);
    const batch = writeBatch(db);

    // Prepare the new user's profile data
    const newUserProfileData: Omit<UserProfile, 'id'> = {
        name: `${additionalData.firstName} ${additionalData.lastName}`.trim(),
        firstName: additionalData.firstName,
        lastName: additionalData.lastName,
        username: additionalData.username,
        email: user.email || "",
        mobileNumber: additionalData.mobileNumber,
        profilePhotoUrl: user.photoURL || "",
        depositBalance: 0, // IMPORTANT: Bonus is applied by a backend process, not on creation.
        winningsBalance: 0,
        tournamentsPlayed: 0,
        wins: 0,
        totalEarnings: 0,
        role: 'user',
        status: 'active',
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(), // Their own unique code
        createdAt: serverTimestamp(),
    };
    
    // If a referral code was used, log who referred this user.
    if (additionalData.referralCode) {
        (newUserProfileData as any).referredBy = additionalData.referralCode;
    }
    
    // Write 1: Create the new user's profile
    batch.set(newUserRef, newUserProfileData);
    
    // Write 2: If a referral code was used, create a pending request for a backend process to handle.
    if (additionalData.referralCode) {
        const pendingRef = doc(collection(db, "pendingReferrals"));
        batch.set(pendingRef, {
            newUserId: user.uid,
            referrerCode: additionalData.referralCode,
            createdAt: serverTimestamp(),
            processed: false,
        });
    }

    // Commit both writes at the same time.
    await batch.commit();
}

/**
 * Fetches a user's profile from Firestore.
 * @param uid The user's ID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db) {
        console.warn("Firestore is not initialized.");
        return null;
    }
    try {
        const userRef = doc(db, "users", uid).withConverter(userProfileConverter);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? userSnap.data() : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        console.warn("This might be because Firestore is not enabled in your Firebase project or security rules are not set up correctly.");
        return null;
    }
}

/**
 * Updates a user's profile in Firestore.
 * @param userId The ID of the user to update.
 * @param data The partial data to update.
 */
export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, 'id' | 'name'>>) {
    if (!db) throw new Error("Firestore is not initialized.");
    const userRef = doc(db, "users", userId);

    const updateData = { ...data };
    
    // If firstName or lastName is being updated, reconstruct the full name
    if (data.firstName || data.lastName) {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const currentData = userSnap.data() as UserProfile;
            const newFirstName = data.firstName ?? currentData.firstName;
            const newLastName = data.lastName ?? currentData.lastName;
            (updateData as any).name = `${newFirstName} ${newLastName}`.trim();
        }
    }

    await updateDoc(userRef, updateData);
}

/**
 * Adjusts a user's wallet balance (admin only).
 * @param userId The ID of the user whose wallet is being adjusted.
 * @param amount The amount to adjust by (positive for credit, negative for debit).
 * @param walletType The type of wallet to adjust ('deposit' or 'winnings').
 * @param reason A description for the transaction log.
 */
export async function adjustUserWallet(userId: string, amount: number, walletType: 'deposit' | 'winnings', reason: string) {
    if (!db) throw new Error("Firestore is not initialized.");
    if (amount === 0) throw new Error("Amount cannot be zero.");

    const userRef = doc(db, "users", userId);
    const transactionRef = doc(collection(db, `users/${userId}/transactions`));

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User does not exist.");
        }

        const currentUserProfile = userDoc.data() as UserProfile;
        const currentBalance = walletType === 'deposit' ? currentUserProfile.depositBalance : currentUserProfile.winningsBalance;
        const newBalance = currentBalance + amount;

        if (newBalance < 0) {
            throw new Error(`Insufficient ${walletType} balance.`);
        }

        const walletFieldToUpdate = walletType === 'deposit' ? 'depositBalance' : 'winningsBalance';
        transaction.update(userRef, { [walletFieldToUpdate]: newBalance });

        const transactionType = amount > 0 ? 'admin_credit' : 'admin_debit';
        transaction.set(transactionRef, {
            type: transactionType,
            description: reason,
            amount: amount,
            date: serverTimestamp()
        });
    });
}


/**
 * Sets up a real-time listener for a user's profile.
 * @param uid The user's ID.
 * @param callback The function to call with the profile data.
 */
export function onUserProfileSnapshot(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
    if (!db) {
      console.warn("Firestore is not initialized, cannot set up snapshot listener.");
      return () => {}; // Return a no-op unsubscribe function
    }
    const userRef = doc(db, "users", uid).withConverter(userProfileConverter);
    return onSnapshot(userRef, (doc) => {
        callback(doc.exists() ? doc.data() : null);
    }, (error) => {
        console.error("Error with user profile snapshot:", error);
        console.warn("This might be because Firestore is not enabled in your Firebase project or security rules are not set up correctly.");
        callback(null);
    });
}


// --- Game and Tournament Functions ---

/**
 * Fetches all games from the 'games' collection.
 */
export async function getGames(): Promise<Game[]> {
    if (!db) return [];
    try {
        const gamesRef = collection(db, "games").withConverter(gameConverter);
        const gamesSnap = await getDocs(gamesRef);
        return gamesSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching games:", error);
        console.warn("This might be because Firestore is not enabled in your Firebase project or security rules are not set up correctly.");
        return [];
    }
}

/**
 * Fetches a single game by its ID.
 */
export async function getGame(id: string): Promise<Game | null> {
    if (!db) return null;
    try {
        const gameRef = doc(db, "games", id).withConverter(gameConverter);
        const gameSnap = await getDoc(gameRef);
        return gameSnap.exists() ? gameSnap.data() : null;
    } catch (error) {
        console.error(`Error fetching game with ID ${id}:`, error);
        console.warn("This might be because Firestore is not enabled or security rules are not set up correctly.");
        return null;
    }
}

/**
 * Fetches all tournaments for a specific game ID.
 */
export async function getTournamentsByGameId(gameId: string): Promise<Tournament[]> {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "tournaments"), 
            where("gameId", "==", gameId)
        ).withConverter(tournamentConverter);
        
        const tournamentsSnap = await getDocs(q);
        const tournaments = tournamentsSnap.docs.map(doc => doc.data());

        // The server-side render doesn't need the full list of participants,
        // and doesn't have permission to fetch it anyway.
        // We will rely on client-side logic (AuthContext) to know if a user has joined.
        return tournaments;
    } catch (error) {
        console.error(`Error fetching tournaments for game ID ${gameId}:`, error);
        console.warn("This might be because Firestore is not enabled in your Firebase project or security rules are not set up correctly.");
        return [];
    }
}


/**
 * Fetches tournaments a user has joined. This uses a collection group query.
 */
export async function getUserJoinedTournaments(userId: string): Promise<Tournament[]> {
    if (!db) return [];
    try {
        const participantsRef = collectionGroup(db, 'participants');
        const q = query(participantsRef, where('id', '==', userId));
        const participantsSnap = await getDocs(q);

        if (participantsSnap.empty) {
            return [];
        }

        const tournamentPromises = participantsSnap.docs.map(participantDoc => {
            const tournamentRef = participantDoc.ref.parent.parent!; // this is the tournament document
            return getDoc(tournamentRef.withConverter(tournamentConverter));
        });

        const tournamentDocs = await Promise.all(tournamentPromises);
        
        const tournaments = tournamentDocs
            .map(doc => doc.exists() ? doc.data() : null)
            .filter((t): t is Tournament => t !== null);

        // The 'joinedUsers' property is intentionally left empty here.
        // It will be populated on-demand by the client when needed (e.g., clicking 'View Players').
        return tournaments;

    } catch (error) {
        console.error(`Error fetching joined tournaments for user ${userId}:`, error);
        if ((error as any).code === 'failed-precondition') {
             console.warn("Firestore requires a collection group index for this query. Please check the Firebase console for a link to create it. The index should be on the 'participants' collection, for the field 'id', with scope 'Collection group'.");
        } else {
             console.warn("This might be because Firestore is not enabled or security rules are not set up correctly.");
        }
        return [];
    }
}


/**
 * Allows a user to join a tournament. Uses a transaction to ensure atomicity.
 * @param user The authenticated user.
 * @param userProfile The user's profile data.
 * @param tournament The tournament to join.
 * @param teamMembers An array of objects with the in-game names of all team members.
 */
export async function joinTournament(user: AuthUser, userProfile: UserProfile, tournament: Tournament, teamMembers: { inGameName: string }[]) {
    if (!db) throw new Error("Firestore is not initialized.");

    const tournamentRef = doc(db, "tournaments", tournament.id);
    const userRef = doc(db, "users", user.uid);
    const participantRef = doc(db, `tournaments/${tournament.id}/participants`, user.uid);
    const transactionRef = doc(collection(db, `users/${user.uid}/transactions`));

    // Check if user has enough balance
    const totalBalance = userProfile.depositBalance + userProfile.winningsBalance;
    if (totalBalance < tournament.entryFee) {
        throw new Error("Insufficient balance.");
    }
    
    await runTransaction(db, async (transaction) => {
        const tDoc = await transaction.get(tournamentRef);
        const uDoc = await transaction.get(userRef);

        if (!tDoc.exists() || !uDoc.exists()) {
            throw new Error("Tournament or user does not exist!");
        }

        const currentTournamentData = tDoc.data() as Tournament;
        const playersJoined = (currentTournamentData.playersJoined || 0);


        // Check if tournament is full
        if (playersJoined >= currentTournamentData.maxPlayers) {
            throw new Error("Tournament is full.");
        }

        // Check if user has already joined
        const participantDoc = await transaction.get(participantRef);
        if (participantDoc.exists()) {
            throw new Error("You have already joined this tournament.");
        }
        
        const currentUserProfile = uDoc.data() as UserProfile;

        // Calculate new balances
        let newDepositBalance = currentUserProfile.depositBalance;
        let newWinningsBalance = currentUserProfile.winningsBalance;

        if (newDepositBalance >= tournament.entryFee) {
            newDepositBalance -= tournament.entryFee;
        } else {
            const remainingFee = tournament.entryFee - newDepositBalance;
            newDepositBalance = 0;
            newWinningsBalance -= remainingFee;
        }

        // Update tournament document
        transaction.update(tournamentRef, {
            playersJoined: increment(1),
        });

        // Update user document (wallet balance and stats)
        transaction.update(userRef, {
            depositBalance: newDepositBalance,
            winningsBalance: newWinningsBalance,
            tournamentsPlayed: increment(1)
        });

        // Create participant document
        transaction.set(participantRef, {
            id: user.uid,
            name: currentUserProfile.name,
            email: currentUserProfile.email,
            inGameName: teamMembers[0].inGameName, // Leader's name
            teamMembers: teamMembers,
            joinTime: serverTimestamp()
        });

        // Create transaction record
        transaction.set(transactionRef, {
            type: 'join_fee',
            description: `Joined "${tournament.name}"`,
            amount: -tournament.entryFee,
            date: serverTimestamp()
        });
    });
}


// --- Wallet & Transaction Functions ---

/**
 * Fetches all transactions for a specific user.
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
    if (!db) return [];
    try {
        const transactionsRef = collection(db, `users/${userId}/transactions`);
        const q = query(transactionsRef, orderBy("date", "desc")).withConverter(transactionConverter);
        const transactionsSnap = await getDocs(q);
        return transactionsSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error(`Error fetching transactions for user ${userId}:`, error);
        console.warn("This might be because Firestore is not enabled or security rules are not set up correctly.");
        return [];
    }
}

/**
 * Adds funds to a user's wallet.
 * @param userId The ID of the user.
 * @param amount The amount to add.
 */
export async function addFundsToWallet(userId: string, amount: number) {
    if (!db) throw new Error("Firestore is not initialized.");
    if (amount <= 0) throw new Error("Amount must be positive.");

    const userRef = doc(db, "users", userId);
    const transactionRef = doc(collection(db, `users/${userId}/transactions`));

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User does not exist.");
        }
        
        // Update user's deposit balance
        transaction.update(userRef, { depositBalance: increment(amount) });

        // Create transaction record
        transaction.set(transactionRef, {
            type: 'deposit',
            description: 'Added funds to wallet',
            amount: amount,
            date: serverTimestamp()
        });
    });
}

/**
 * Creates a withdrawal request. This deducts from winnings and creates a request document for admin review.
 * @param user The authenticated user.
 * @param userProfile The user's profile data.
 * @param amount The amount to withdraw.
 * @param upiId The UPI ID for the withdrawal.
 */
export async function createWithdrawalRequest(user: AuthUser, userProfile: UserProfile, amount: number, upiId: string) {
    if (!db) throw new Error("Firestore is not initialized.");
    if (amount <= 0) throw new Error("Amount must be positive.");
    
    const userRef = doc(db, "users", user.uid);
    const withdrawalRef = doc(collection(db, "withdrawals"));
    const userTransactionRef = doc(collection(db, `users/${user.uid}/transactions`));
    
    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found.");
        const latestUserProfile = userDoc.data() as UserProfile;

        if (amount > latestUserProfile.winningsBalance) {
            throw new Error("Insufficient winnings balance.");
        }

        // 1. Deduct amount from user's winnings balance
        transaction.update(userRef, {
            winningsBalance: increment(-amount)
        });

        // 2. Create withdrawal request document
        const newWithdrawalRequest = {
            userId: user.uid,
            userName: userProfile.name,
            userEmail: userProfile.email,
            amount: amount,
            upiId: upiId,
            status: 'pending',
            requestDate: serverTimestamp(),
        };
        transaction.set(withdrawalRef, newWithdrawalRequest);
        
        // 3. Create a transaction log for the user
        transaction.set(userTransactionRef, {
            type: 'withdrawal',
            description: `Withdrawal request to ${upiId}`,
            amount: -amount,
            date: serverTimestamp()
        });
    });
}


// --- Admin: Game Management ---

/**
 * Adds a new game to the 'games' collection.
 * @param gameData The name and imageUrl for the new game.
 * @returns The ID of the newly created game document.
 */
export async function addGame(gameData: { name: string, imageUrl: string }): Promise<string> {
    if (!db) throw new Error("Firestore is not initialized.");
    const gamesRef = collection(db, "games");
    const newGameData = { 
        ...gameData,
        hint: gameData.name.toLowerCase().replace(/\s/g, '_'), // Auto-generate a hint
    };
    const docRef = await addDoc(gamesRef, newGameData);
    return docRef.id;
}

/**
 * Updates an existing game in the 'games' collection.
 * @param gameId The ID of the game to update.
 * @param gameData The data to update.
 */
export async function updateGame(gameId: string, gameData: Partial<Omit<Game, 'id'>>) {
    if (!db) throw new Error("Firestore is not initialized.");
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, gameData);
}

/**
 * Deletes a game from the 'games' collection.
 * @param gameId The ID of the game to delete.
 */
export async function deleteGame(gameId: string) {
    if (!db) throw new Error("Firestore is not initialized.");
    const gameRef = doc(db, "games", gameId);
    await deleteDoc(gameRef);
}

// --- Admin: Tournament Management ---

/**
 * Fetches all tournaments from the 'tournaments' collection for the admin panel.
 * This version is optimized to NOT fetch all participants for every tournament.
 */
export async function getAllTournaments(): Promise<Tournament[]> {
    if (!db) return [];
    try {
        const tournamentsRef = collection(db, "tournaments").withConverter(tournamentConverter);
        const tournamentsSnap = await getDocs(tournamentsRef);
        // This is now much faster as it doesn't fetch subcollections.
        return tournamentsSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching all tournaments:", error);
        console.warn("This might be because Firestore is not enabled or security rules are not set up correctly.");
        return [];
    }
}

/**
 * Fetches the list of players for a single tournament.
 * @param tournamentId The ID of the tournament.
 */
export async function getTournamentParticipants(tournamentId: string): Promise<Player[]> {
    if (!db) return [];
    try {
        const participantsCollection = collection(db, `tournaments/${tournamentId}/participants`).withConverter(playerConverter);
        const participantsSnap = await getDocs(participantsCollection);
        return participantsSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error(`Error fetching participants for tournament ${tournamentId}:`, error);
        return [];
    }
}


/**
 * Adds a new tournament to the 'tournaments' collection.
 * @param tournamentData The data for the new tournament.
 * @returns The ID of the newly created tournament document.
 */
export async function addTournament(tournamentData: {
    name: string;
    gameId: string;
    gameName: string;
    gameImageUrl: string;
    entryFee: number;
    prizePool: number;
    prizeDescription?: string;
    perKillReward: number;
    startTime: Date;
    maxPlayers: number;
    teamType: TeamType;
    map?: string;
    mode?: string;
    rules?: string;
}): Promise<string> {
    if (!db) throw new Error("Firestore is not initialized.");
    const tournamentsRef = collection(db, "tournaments");

    const newTournamentData = {
        ...tournamentData,
        status: 'upcoming',
        playersJoined: 0,
    };
    
    const docRef = await addDoc(tournamentsRef, newTournamentData);
    return docRef.id;
}


/**
 * Updates an existing tournament in the 'tournaments' collection.
 * @param tournamentId The ID of the tournament to update.
 * @param tournamentData The data to update.
 */
export async function updateTournament(tournamentId: string, tournamentData: Partial<Omit<Tournament, 'id' | 'joinedUsers'>>) {
    if (!db) throw new Error("Firestore is not initialized.");
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await updateDoc(tournamentRef, tournamentData);
}

/**
 * Deletes a tournament from the 'tournaments' collection.
 * @param tournamentId The ID of the tournament to delete.
 */
export async function deleteTournament(tournamentId: string) {
    if (!db) throw new Error("Firestore is not initialized.");
    // In a production app, you might want a Cloud Function to recursively delete subcollections.
    // For this app, we'll just delete the tournament document itself.
    const tournamentRef = doc(db, "tournaments", tournamentId);
    await deleteDoc(tournamentRef);
}

/**
 * Submits tournament results, updates status, and distributes winnings.
 * @param tournamentId The ID of the tournament.
 * @param tournamentName The name of the tournament for transaction descriptions.
 * @param finalResults The array of player results.
 */
export async function submitTournamentResults(tournamentId: string, tournamentName: string, finalResults: TournamentResult[]) {
    if (!db) throw new Error("Firestore is not initialized.");
    const batch = writeBatch(db);

    // 1. Update the main tournament document with results and completed status
    const tournamentRef = doc(db, "tournaments", tournamentId);
    batch.update(tournamentRef, { results: finalResults, status: 'completed' });

    // 2. Process winnings for each player who won a prize
    for (const result of finalResults) {
        if (result.prize > 0) {
            const userRef = doc(db, "users", result.playerId);
            const transactionRef = doc(collection(db, `users/${result.playerId}/transactions`));

            // Prepare the updates for the user's profile
            const userUpdates: any = {
                winningsBalance: increment(result.prize),
                totalEarnings: increment(result.prize),
            };
            if (result.rank === 1) {
                userUpdates.wins = increment(1);
            }
            batch.update(userRef, userUpdates);

            // Create a new transaction document for the prize
            batch.set(transactionRef, {
                type: 'prize',
                description: `Prize from "${tournamentName}"`,
                amount: result.prize,
                date: serverTimestamp()
            });
        }
    }

    // 3. Commit all batched writes to Firestore
    await batch.commit();
}


// --- Admin: Carousel Management ---

/**
 * Fetches all slides for the dashboard carousel.
 */
export async function getCarouselSlides(): Promise<CarouselSlide[]> {
    if (!db) return [];
    try {
        const slidesRef = collection(db, "carouselSlides").withConverter(carouselSlideConverter);
        const slidesSnap = await getDocs(slidesRef);
        return slidesSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching carousel slides:", error);
        return [];
    }
}

/**
 * Adds a new slide to the carousel.
 */
export async function addCarouselSlide(slideData: Omit<CarouselSlide, 'id'>): Promise<string> {
    if (!db) throw new Error("Firestore is not initialized.");
    const slidesRef = collection(db, "carouselSlides");
    const docRef = await addDoc(slidesRef, slideData);
    return docRef.id;
}

/**
 * Updates an existing carousel slide.
 */
export async function updateCarouselSlide(slideId: string, slideData: Partial<Omit<CarouselSlide, 'id'>>) {
    if (!db) throw new Error("Firestore is not initialized.");
    const slideRef = doc(db, "carouselSlides", slideId);
    await updateDoc(slideRef, slideData);
}

/**
 * Deletes a carousel slide.
 */
export async function deleteCarouselSlide(slideId: string) {
    if (!db) throw new Error("Firestore is not initialized.");
    const slideRef = doc(db, "carouselSlides", slideId);
    await deleteDoc(slideRef);
}


// --- Admin: User Management ---

/**
 * Fetches all users from the 'users' collection.
 */
export async function getAllUsers(): Promise<UserProfile[]> {
    if (!db) return [];
    try {
        const usersRef = collection(db, "users").withConverter(userProfileConverter);
        const usersSnap = await getDocs(usersRef);
        return usersSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching all users:", error);
        if ((error as any).code === 'permission-denied') {
             console.warn("Permission denied. Ensure the admin user has the correct role and Firestore rules allow listing users.");
        }
        return [];
    }
}


// --- Admin: Withdrawal Management ---

/**
 * Fetches all withdrawal requests for the admin panel.
 */
export async function getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    if (!db) return [];
    try {
        const requestsRef = collection(db, "withdrawals").withConverter(withdrawalRequestConverter);
        const requestsSnap = await getDocs(requestsRef);
        return requestsSnap.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
        return [];
    }
}

/**
 * Updates the status of a withdrawal request.
 * If rejected, it refunds the amount to the user's winnings.
 * @param withdrawalId The ID of the withdrawal request.
 * @param status The new status ('completed' or 'rejected').
 * @param userId The ID of the user who made the request.
 * @param amount The amount of the withdrawal.
 */
export async function updateWithdrawalStatus(withdrawalId: string, status: 'completed' | 'rejected', userId: string, amount: number) {
    if (!db) throw new Error("Firestore is not initialized.");

    const withdrawalRef = doc(db, "withdrawals", withdrawalId);
    const userRef = doc(db, "users", userId);
    
    const batch = writeBatch(db);

    // Update the withdrawal request status
    batch.update(withdrawalRef, {
        status: status,
        processedDate: serverTimestamp()
    });

    if (status === 'rejected') {
        // Refund the amount to the user's winnings balance
        batch.update(userRef, {
            winningsBalance: increment(amount)
        });

        // Add a refund transaction to the user's history
        const transactionRef = doc(collection(db, `users/${userId}/transactions`));
        batch.set(transactionRef, {
            type: 'refund',
            description: 'Withdrawal request rejected',
            amount: amount,
            date: serverTimestamp()
        });
    }

    await batch.commit();
}


// --- Support Ticket System ---

/**
 * Creates a new support ticket.
 * @param ticketData The initial data for the ticket.
 */
export async function createSupportTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    if (!db) throw new Error("Firestore is not initialized.");
    const ticketsRef = collection(db, "supportTickets");
    const docRef = await addDoc(ticketsRef, {
        ...ticketData,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Adds a new message to a support ticket and updates the ticket's timestamp.
 * @param ticketId The ID of the support ticket.
 * @param messageData The message content.
 */
export async function addSupportMessage(ticketId: string, messageData: Omit<SupportMessage, 'id' | 'timestamp'>) {
    if (!db) throw new Error("Firestore is not initialized.");
    const batch = writeBatch(db);

    const ticketRef = doc(db, "supportTickets", ticketId);
    const messageRef = doc(collection(db, `supportTickets/${ticketId}/messages`));
    
    // Add the new message
    batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
    });
    
    // Update the parent ticket's updatedAt timestamp
    batch.update(ticketRef, {
        updatedAt: serverTimestamp()
    });
    
    await batch.commit();
}


/**
 * Fetches all support tickets for a specific user.
 */
export async function getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    if (!db) return [];
    const ticketsRef = collection(db, "supportTickets");
    const q = query(
        ticketsRef, 
        where("userId", "==", userId)
    ).withConverter(supportTicketConverter);
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => doc.data());
    // Sort on the client to avoid needing a composite index
    tickets.sort((a, b) => (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime());
    return tickets;
}


/**
 * Fetches all support tickets for the admin panel.
 */
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
    if (!db) return [];
    const ticketsRef = collection(db, "supportTickets");
    const q = query(
        ticketsRef,
        orderBy("updatedAt", "desc")
    ).withConverter(supportTicketConverter);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
}


/**
 * Fetches a single support ticket by its ID.
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
    if (!db) return null;
    const ticketRef = doc(db, "supportTickets", ticketId).withConverter(supportTicketConverter);
    const snapshot = await getDoc(ticketRef);
    return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Sets up a real-time listener for messages in a support ticket.
 */
export function onSupportTicketMessagesSnapshot(ticketId: string, callback: (messages: SupportMessage[]) => void): Unsubscribe {
    if (!db) return () => {};
    const messagesRef = collection(db, `supportTickets/${ticketId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "asc")).withConverter(supportMessageConverter);
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data());
        callback(messages);
    });
}

/**
 * Updates the status of a support ticket.
 */
export async function updateSupportTicketStatus(ticketId: string, status: SupportTicketStatus) {
    if (!db) throw new Error("Firestore is not initialized.");
    const ticketRef = doc(db, "supportTickets", ticketId);
    await updateDoc(ticketRef, {
        status,
        updatedAt: serverTimestamp()
    });
}
