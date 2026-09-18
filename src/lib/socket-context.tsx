"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { getAccessToken } from "./token-storage";

// One socket connection per signed-in session, established once auth is
// known and torn down on logout — not one per component that happens to
// need live updates. Consumers (dashboard/messages/page.tsx today) read it
// via useSocket() and attach their own event listeners; this context only
// owns the connection lifecycle, not any particular feature's events.
const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket(null);
      return;
    }
    const token = getAccessToken();
    if (!token) return;

    // Auth is sent in the handshake payload, not a header — that's how
    // socket.io-client expects it, and matches what lib/socket.js on the
    // backend reads via socket.handshake.auth.token.
    const s = io(process.env.NEXT_PUBLIC_API_URL, { auth: { token } });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

/** Returns the current socket, or null while unauthenticated/connecting.
    Every consumer has to handle the null case — there is no guarantee a
    connection exists yet at the moment a component mounts. */
export function useSocket() {
  return useContext(SocketContext);
}
