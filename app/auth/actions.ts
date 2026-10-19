"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// Callable without being an admin on purpose: a signed-in non-admin lands on
// /login and needs a way to switch accounts.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
