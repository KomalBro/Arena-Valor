
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  type User
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { type UserProfile } from "@/types";
import { getUserProfile, onUserProfileSnapshot, getUserJoinedTournaments } from "@/lib/firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  joinedTournamentIds: Set<string>;
  addJoinedTournament: (tournamentId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [joinedTournamentIds, setJoinedTournamentIds] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const addJoinedTournament = (tournamentId: string) => {
    setJoinedTournamentIds(prev => new Set(prev).add(tournamentId));
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubscribeProfile: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // If profile listener exists, unsubscribe from it
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }
      
      if (user) {
        setUser(user);
        
        // Fetch joined tournaments when user logs in
        getUserJoinedTournaments(user.uid).then(tournaments => {
            const ids = new Set(tournaments.map(t => t.id));
            setJoinedTournamentIds(ids);
        });

        // Set up a real-time listener for the user's profile
        unsubscribeProfile = onUserProfileSnapshot(user.uid, (profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
             // This case can happen if the profile doc hasn't been created yet.
            setUserProfile(null);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setJoinedTournamentIds(new Set());
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    // No matter what, route to login after logout action
    router.push('/login');
  };
  
  const value = {
    user,
    userProfile,
    loading,
    logout,
    joinedTournamentIds,
    addJoinedTournament,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
