"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { getAccessToken } from "./token-storage";
import { tryRefresh } from "./backend-client";

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

    // `auth` as a callback, not a static `{ token }` object: socket.io-
    // client calls this fresh before EVERY (re)connection attempt, not
    // just the first. Access tokens expire in 15 minutes (JWT_ACCESS_
    // EXPIRES_IN) — a static object would keep resending the token that
    // was valid when this effect first ran, so any reconnect (a brief
    // network blip, the API redeploying) after that window would have the
    // backend's handshake auth (lib/socket.js) reject an expired token
    // forever, with no visible error and no way to recover short of a full
    // page reload. This always reads whatever's currently in storage,
    // which is what backend-client.ts's tryRefresh() keeps current.
    const s = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: (cb) => cb({ token: getAccessToken() }),
    });

    // The `auth` callback above always reads the current token, but nothing
    // else keeps that token current while this socket sits idle — the only
    // refresh path elsewhere (backend-client.ts's authedRequest) is purely
    // reactive to a REST call getting a 401, and a long-lived socket can go
    // the whole 15-minute access-token lifetime without one. Without this,
    // a reconnect after expiry (a network blip, an API redeploy) would keep
    // retrying with the same dead token forever, since socket.io-client's
    // default infinite reconnection never refreshes it on its own. One
    // refresh attempt in flight at a time — repeated connect_errors while a
    // refresh is already pending would otherwise fire redundant requests.
    let refreshing = false;
    const onConnectError = () => {
      if (refreshing) return;
      refreshing = true;
      tryRefresh().finally(() => {
        refreshing = false;
      });
    };
    s.on("connect_error", onConnectError);

    setSocket(s);

    return () => {
      s.off("connect_error", onConnectError);
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
