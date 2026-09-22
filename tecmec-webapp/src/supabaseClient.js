// Cliente único do Supabase, usado por todos os módulos que precisam
// gravar/ler dados ou subir arquivos (Storage).
import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "./state.js";

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
