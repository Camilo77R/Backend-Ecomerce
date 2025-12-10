// esto es => Middleware reutilizable

 const { error, timeStamp } = require('console');
const jwt = require('jsonwebtoken');


//  hago un fn de orden superior para la autenticacion 
const authenticateToken = (req, res, next) =>{
    const authHeader = req.headers['authorization'] //esto es lo que necesito los header de la peticion tengan
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({error: 'Access token required'}); //fallo el token de acceso para acceder
    };

    jwt.verify(token,process.env.JWT_SECRET,(err, user)=>{
        req.user = user;
        next();
    }); 
};


// esto es para crear respuestas concistentes 
const createResponse = (success,  data, error= null)=>({
    success,
    data,
    error,
    timeStamp: new Date().toString()
});

module.exports = {
    authenticateToken, createResponse
};

