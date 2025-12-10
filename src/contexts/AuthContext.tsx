
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus, AccountInfo } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';

interface AuthContextType {
    user: AccountInfo | null;
    login: () => void;
    logout: () => void;
    isAuthenticated: boolean;
    inProgress: InteractionStatus;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { instance, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [user, setUser] = useState<AccountInfo | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            const currentAccount = instance.getActiveAccount();
            if (currentAccount) {
                setUser(currentAccount);
            }
        } else {
            setUser(null);
        }
    }, [isAuthenticated, instance]);


    const login = () => {
        if (inProgress === InteractionStatus.None) {
            instance.loginRedirect(loginRequest).catch(e => {
                console.error(e);
            });
        }
    };

    const logout = () => {
        instance.logoutRedirect();
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated,
        inProgress
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
