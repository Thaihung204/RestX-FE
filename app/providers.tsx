"use client";

import I18nProvider from "@/components/I18nProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import AutoDarkThemeProvider from "./theme/AutoDarkThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <AuthProvider>
                <AutoDarkThemeProvider>{children}</AutoDarkThemeProvider>
            </AuthProvider>
        </I18nProvider>
    );
}
