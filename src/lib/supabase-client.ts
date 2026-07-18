import { createClient } from "@supabase/supabase-js";

// Used only for the imports wizard's direct-to-Storage upload (docs/api.md
// "Imports" — POST /api/imports returns a signed upload target consumed via
// `supabase.storage.from(bucket).uploadToSignedUrl(...)`). Auth/session state
// stays with our own cookie + axios client; this instance never signs in.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
