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

    // Eliminar el usuario
    const userResult = await db.collection("users").deleteOne({
      _id: new ObjectId(userId),
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
