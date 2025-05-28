const { MongoClient } = require("mongodb");
//nst bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function (context, req) {
  context.log(" MONGO_URI:", process.env.MONGO_URI);
  context.log(" JWT_SECRET:", process.env.JWT_SECRET);

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" }
    };
    return;
  }

  const { email, password } = req.body;

  if (!email || !password) {
    context.res = {
      status: 400,
      body: { message: "Email y contraseña son requeridos" }
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado" }
      };
      return;
    }

    if (!user.verificado) {
      context.res = {
        status: 403,
        body: { message: "Tu cuenta aún no ha sido verificada. Revisa tu correo." }
      };
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      context.res = {
        status: 401,
        body: { message: "Contraseña incorrecta" }
      };
      return;
    }

    const token = jwt.sign(
      {
        id: user._id.toString(), // <- aquí el cambio
        email: user.email,
        nombre: user.nombre
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    

    context.res = {
      status: 200,
      body: {
        message: "Inicio de sesión exitoso",
        token,
        nombre: user.nombre,
        nombreNino: user.nombreNino,
        _id_usuario: user._id.toString(),
        isTempPassword: !!user.isTempPassword  
      }
    };

  } catch (error) {
    context.log("Error en login:", error);
    context.res = {
      status: 500,
      body: { message: "Error del servidor" }
    };
  } finally {
    await client.close();
  }
};
