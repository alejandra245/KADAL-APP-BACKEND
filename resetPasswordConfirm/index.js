const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    context.res = {
      status: 400,
      body: { message: "Faltan campos obligatorios (token y nueva contraseña)" },
    };
    return;
  }

  try {
    // Verificamos token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;  // Ahora es un string, no un ObjectId

    // Validamos nueva contraseña
    if (newPassword.length < 8) {
      context.res = {
        status: 400,
        body: { message: "La contraseña debe tener al menos 8 caracteres" },
      };
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const client = new MongoClient(uri);

    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id_usuario: userId }, // ✅ buscamos por el campo string
      { $set: { password: hashedPassword, isTempPassword: false } }
    );

    if (result.modifiedCount === 1) {
      context.res = {
        status: 200,
        body: { message: "Contraseña actualizada correctamente" },
      };
    } else {
      context.res = {
        status: 400,
        body: { message: "No se pudo actualizar la contraseña" },
      };
    }

    await client.close();
  } catch (error) {
    context.log("Error en resetPasswordConfirm:", error);
    context.res = {
      status: 401,
      body: { message: "Token inválido o expirado" },
    };
  }
};
