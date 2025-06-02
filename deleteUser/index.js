const axios = require("axios");
const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "DELETE") {
    context.res = {
      status: 405,
      body: "Método no permitido",
    };
    return;
  }

  const { userId } = req.body;

  if (!userId) {
    context.res = {
      status: 400,
      body: "Falta el ID del usuario",
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");

    // Obtener el usuario antes de borrarlo
    const usuario = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (usuario) {
      // Preparar y enviar la orden al ESP32
      const payload = {
        accion: "eliminarVinculacion",
        _id_usuario: usuario._id.toString() 
      };

      try {
        await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
        context.log("Orden de eliminación enviada al ESP32:", payload._id_usuario);
      } catch (axiosError) {
        context.log.warn("No se pudo enviar la orden de eliminación al ESP32:", axiosError.message);
        // Puedes decidir abortar aquí si lo deseas, pero como pediste mantener la lógica, continuamos.
      }
    }

    // Eliminar el usuario
    const userResult = await db.collection("users").deleteOne({
      _id: userId,
    });

    if (userResult.deletedCount === 0) {
      context.res = {
        status: 404,
        body: "Usuario no encontrado",
      };
      return;
    }

    // Eliminar contactos de emergencia
    await db.collection("contacts").deleteMany({ _id_usuario: userId });

    // Eliminar geocercas
    await db.collection("geocercas").deleteMany({ _id_usuario: userId });

    // Eliminar llamadas
    await db.collection("llamadas").deleteMany({ _id_usuario: userId });

    // Eliminar notificaciones
    await db.collection("notificaciones").deleteMany({ _id_usuario: userId });

    // Eliminar ubicaciones
    await db.collection("ubicaciones").deleteMany({ _id_usuario: userId });

    context.res = {
      status: 200,
      body: "Usuario y datos relacionados eliminados exitosamente",
    };
  } catch (error) {
    context.log("Error al eliminar usuario y datos:", error);
    context.res = {
      status: 500,
      body: "Error interno del servidor",
    };
  } finally {
    await client.close();
  }
};
