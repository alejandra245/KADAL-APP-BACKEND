const axios = require("axios");
const { MongoClient, ObjectId } = require("mongodb");
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

    if (result.matchedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado o sin cambios" }
      };
      return;
    }

    // 1. Obtener el usuario actualizado para extraer el _id real de MongoDB
    const usuarioActualizado = await users.findOne({ _id: new ObjectId(userId) });
    if (!usuarioActualizado) {
      context.res = {
        status: 404,
        body: { message: "No se encontró el usuario actualizado" }
      };
      return;
    }

    // 2. Construir el payload para el ESP32 usando el _id real como _id_usuario
    const payload = {
      accion: "editarCtcTut",
      ctcTut: {
        _id_usuario: usuarioActualizado._id.toString(), // usar el _id de MongoDB
        nombre: usuarioActualizado.nombre || "",
        telefono: usuarioActualizado.telefono || ""
      }
    };

    // 3. Enviar el payload al ESP32 (opcional: manejar error de envío)
    try {
      await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
      context.log("Usuario editado enviado al dispositivo:", usuarioActualizado._id.toString());
    } catch (axiosError) {
      context.log.warn("No se pudo enviar el usuario editado al dispositivo:", axiosError.message);
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
