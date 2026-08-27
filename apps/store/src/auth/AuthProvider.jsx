import { createContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured, authRedirectUrl, passwordResetRedirectUrl } from "../lib/supabase.js";

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
      async signUp({ email, password, fullName, phone }) {
        // Role must never travel from the browser: every new account stays a
        // customer until an admin promotes it. Name and phone are safe profile
        // fields, and the database trigger copies them into public.profiles.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authRedirectUrl,
            data: {
              full_name: fullName,
              name: fullName,
              phone,
            },
          },
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

      /**
       * Re-sends the signup confirmation email. Needed because these links are
       * single-use and short-lived, and mail providers routinely prefetch them,
       * which burns the link before the owner ever clicks it.
       */
      async resendConfirmation(email) {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: authRedirectUrl },
        });
        if (error) throw error;
      },

      async requestPasswordReset(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: passwordResetRedirectUrl,
        });
        if (error) throw error;
      },

      async updatePassword(password) {
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        return data.user;
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
