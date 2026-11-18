"use client";

import React, { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WatchPartyProvider } from "@/context/WatchPartyContext";
import PinGate from "@/components/PinGate";

function AuthGatekeeper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PinGate />;
  }

  return <>{children}</>;
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WatchPartyProvider>
        <AuthGatekeeper>{children}</AuthGatekeeper>
      </WatchPartyProvider>
    </AuthProvider>
  );
}
