/**
 * Клиент Supabase для чтения каталога.
 *
 * Значения берутся из переменных окружения (файл .env, шаблон — .env.example):
 *   VITE_SUPABASE_URL      — Project URL (Supabase Dashboard → Settings → API)
 *   VITE_SUPABASE_ANON_KEY — публичный anon-ключ (тот же экран)
 *
 * Если переменные не заданы, supabase === null, и витрина показывает понятную
 * ошибку вместо бесконечной загрузки.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;