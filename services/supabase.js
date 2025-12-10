const { createClient } = require('@supabase/supabase.js');


// factory pattern para crear cliente Supabse
const createSupabaseClient = ()=>{
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_
    );
};


module.exports = createSupabaseClient();