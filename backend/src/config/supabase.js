// backend/src/config/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Variáveis do Supabase não configuradas (.env)");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Nome do bucket criado no painel do Supabase
export const SUPABASE_BUCKET = "produtos";
