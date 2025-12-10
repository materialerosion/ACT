
"use client";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../authConfig";
import { AuthProvider } from "../contexts/AuthContext";
import { ReactNode } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

export function Providers({ children }: { children: ReactNode }) {
    return (
        <MsalProvider instance={msalInstance}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </MsalProvider>
    );
}
