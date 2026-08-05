import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient<Database>>;

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name] || import.meta.env[name as keyof ImportMetaEnv];
    if (value) return String(value);
  }
  return undefined;
}

function createSupabaseServerClient() {
  const supabaseUrl = readEnv("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = readEnv(
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
  );

  // फिक्स: अगर Service Key नहीं है, तो हम वेबसाइट को क्रैश नहीं करेंगे। 
  // बस कंसोल में लाल रंग से वॉर्निंग देंगे और Anon Key से काम चला लेंगे ताकि साइट चलती रहे।
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("🚨 ALERT: SUPABASE_SERVICE_ROLE_KEY .env फ़ाइल में नहीं मिली!");
  }

  const supabaseKey = serviceRoleKey || publishableKey || "";

  return createClient<Database>(supabaseUrl || "", supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let cachedClient: SupabaseServerClient | undefined;
let cachedSignature: string | undefined;

export function getSupabaseAdmin() {
  const signature = [
    readEnv("SUPABASE_URL", "VITE_SUPABASE_URL"),
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ? "service" : "publishable",
    readEnv("SUPABASE_SERVICE_ROLE_KEY")?.slice(-8),
  ].join(":");

  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createSupabaseServerClient();
    cachedSignature = signature;
  }

  return cachedClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseServerClient, {
  get(_, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver);
  },
});
