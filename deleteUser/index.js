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
    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      context.res = {
        status: 404,
        body: "Usuario no encontrado",
      };
    } else {
      context.res = {
        status: 200,
        body: "Usuario eliminado exitosamente",
      };
    }
  } catch (error) {
    context.log("Error al eliminar usuario:", error);
    context.res = {
      status: 500,
      body: "Error interno del servidor",
    };
  } finally {
    await client.close();
  }
};
