import { isSupabaseConfigured, supabase } from "./supabase.ts";

export function getSupabaseClient() {
  return isSupabaseConfigured() ? supabase : null;
}

export async function getActiveAuthSession() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
}

export function subscribeToAuthChanges(callback) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return () => {};
  }

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

export function subscribeToRealtimeTables(tables, callback) {
  const supabase = getSupabaseClient();

  if (!supabase || !Array.isArray(tables) || !tables.length) {
    return () => {};
  }

  const channel = supabase.channel("app-live-updates");

  tables.forEach((table) => {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table
      },
      callback
    );
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
