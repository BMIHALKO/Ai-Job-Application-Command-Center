"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../../lib/firebaseClient";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    signInwithGoogle: () => Promise<void>;
    signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children } : { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const value = useMemo<AuthContextValue>(() => {
        return {
            user,
            loading,
            signInwithGoogle: async () => {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
            },
            signOutUser: async () => {
                await signOut(auth);
            },
        };
    }, [user, loading])

    return <AuthContext.Provider value = { value }>{ children }</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
    return ctx;
}