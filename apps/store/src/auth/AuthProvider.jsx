import { createContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured, authRedirectUrl } from "../lib/supabase.js";

export const AuthContext = createContext(null);

/**
 * Authentication state for the Store Portal.
 *
 * Supabase remains the single source of truth for the session. This provider
 * subscribes to it and exposes the current user; it never copies the access
 * token anywhere, and there is no Zustand store, because there is no client
 * state here that Supabase is not already managing.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      isConfigured: isSupabaseConfigured,

      /**
       * Supabase may or may not return a session depending on whether the
       * project requires email confirmation, so both outcomes are reported
       * rather than assumed.
       */
      async signUp({ email, password }) {
        // Signup metadata is intentionally empty. Role must never travel from
        // the browser: every new account stays a customer until an admin
        // promotes it. The owner's name and phone are saved later through the
        // authenticated onboarding endpoint instead.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirectUrl },
        });

        if (error) throw error;
        return { needsEmailConfirmation: !data.session, session: data.session ?? null };
      },

      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.session;
      },

      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
