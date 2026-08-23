/**
 * Create (or promote) an admin user in Supabase.
 *
 * Usage:
 *   npm run create-admin -- your@email.com
 *   npm run create-admin -- your@email.com PASSWORD123
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
const password = process.argv[3] ?? generatePassword();

if (!email) {
  console.error("Usage: npm run create-admin -- <email> [password]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Ensure the auth user exists.
let userId;
const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
const user = existing?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (user) {
  userId = user.id;
  console.log(`Auth user already exists: ${email} (${userId})`);
} else {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) {
    console.error(`Failed to create user: ${createError.message}`);
    process.exit(1);
  }
  userId = created.user.id;
  console.log(`Created auth user: ${email} (${userId})`);
}

// 2. Upsert the admin profile.
const { error: profileError } = await supabase
  .from("profiles")
  .upsert({ id: userId, email, is_admin: true }, { onConflict: "id" });

if (profileError) {
  console.error(`Failed to set admin profile: ${profileError.message}`);
  process.exit(1);
}

console.log(`Admin ready: ${email}`);
if (process.argv[3] === undefined) {
  console.log(`Generated password: ${password}  (change it after first login)`);
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}
