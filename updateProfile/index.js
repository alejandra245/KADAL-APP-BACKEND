const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "PUT") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" }
    };
    return;
  }

  const { userId, nombre, email, telefono, password } = req.body;

  if (!userId) {
    context.res = {
      status: 400,
      body: { message: "ID de usuario es requerido" }
    };
    return;
  }

  if (!nombre && !email && !telefono && !password) {
    context.res = {
      status: 400,
      body: { message: "Debes ingresar al menos un campo para actualizar" }
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (telefono) updateData.telefono = telefono;
    if (password) {
      if (password.length < 8) {
        context.res = {
          status: 400,
          body: { message: "La contraseña debe tener al menos 8 caracteres" }
        };
        return;
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await users.updateOne(
      { _id: userId }, // ya no se usa ObjectId
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado o sin cambios" }
      };
      return;
    }

    context.res = {
      status: 200,
      body: { message: "Perfil actualizado correctamente" }
    };
  } catch (error) {
    context.log("Error actualizando perfil:", error);
    context.res = {
      status: 500,
      body: { message: "Error del servidor" }
    };
  } finally {
    await client.close();
  }
};
