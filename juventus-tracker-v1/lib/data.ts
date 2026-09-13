import { createClient } from '@/lib/supabase/server';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export function ratingClass(value: number | null) {
  if (value == null) return '';
  if (value < 5) return 'rating-low';
  if (value < 6) return 'rating-mid';
  if (value < 7) return 'rating-good';
  if (value < 8) return 'rating-very-good';
  return 'rating-top';
}
