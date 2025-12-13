const { createClient } = require("@supabase/supabase-js");

// factory pattern para crear cliente Supabse
const createSupabaseClient = ()=>{
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_
    );
};

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;
module.exports = createSupabaseClient();