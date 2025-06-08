const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id_usuario, newPassword } = req.body;

  if (!_id_usuario || !newPassword) {
    context.res = {
      status: 400,
      body: { message: "Faltan campos obligatorios (_id_usuario y newPassword)" },
    };
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    // 🔥 Aquí buscamos por ambos: _id_usuario o _id (como ObjectId)
    const filter = {
      $or: [
        { _id_usuario: _id_usuario },
        { _id: new ObjectId(_id_usuario) }
      ]
    };

    const result = await users.updateOne(
      filter,
      { $set: { password: hashedPassword, isTempPassword: false } }
    );

    await client.close();

    if (result.modifiedCount === 1) {
      context.res = {
        status: 200,
        body: { message: "Contraseña actualizada correctamente" },
      };
    } else {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado o sin cambios" },
      };
    }

  } catch (error) {
    context.log("Error al actualizar contraseña temporal:", error.message);
    context.res = {
      status: 500,
      body: { message: "Error interno del servidor" },
    };
  }
};
