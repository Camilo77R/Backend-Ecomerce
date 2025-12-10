// En tu authController o un testController  
const supabase = require('../services/supabase');  
  
const testConnection = async (req, res) => {  
  try {  
    const { data, error } = await supabase.from('users').select('count');  
    if (error) throw error;  
    res.json({ success: true, message: 'Conexión exitosa a Supabase' });  
  } catch (error) {  
    res.status(500).json({ success: false, error: error.message });  
  }  
};