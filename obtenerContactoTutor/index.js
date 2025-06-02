const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  context.log("Iniciando función obtenerContactoTutor...");

  const { _id_usuario } = req.body;

  if (!_id_usuario) {
    context.res = {
      status: 400,
      body: { message: "Falta el ID del usuario (_id_usuario)" }
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");

    // 🔎 Convertir el _id_usuario en ObjectId y buscar en la colección users
    let user;
    try {
      const objectIdUsuario = new ObjectId(_id_usuario);
      user = await db.collection("users").findOne({ _id: objectIdUsuario });
    } catch (error) {
      context.log.warn("Error al convertir el _id_usuario a ObjectId:", error.message || error);
    }

    if (!user) {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado" }
      };
      return;
    }

    // 🔗 Preparar el JSON para el ESP32
    const payload = {
      accion: "nuevoCtcTut",
      ctcTut: {
        _id_usuario: user._id.toString(), // Enviamos el ObjectId como string
        nombre: user.nombre,
        telefono: user.telefono
      }
    };

    context.log("Payload a enviar:", JSON.stringify(payload));

    context.res = {
      status: 200,
      body: payload
    };
  } catch (error) {
    context.log("Error al obtener contacto tutor:", error.message || error);
    context.res = {
      status: 500,
      body: { message: "Error al obtener contacto tutor", error: error.message || error }
    };
  } finally {
    await client.close();
  }
};
