const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" }
    };
    return;
  }

  const userId = req.query.userId || (req.body && req.body.userId);

  if (!userId) {
    context.res = {
      status: 400,
      body: { message: "Falta el ID del usuario" }
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");

    let query = {};
    if (ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { _id_usuario: userId };
    }

    const result = await db.collection("users").deleteOne(query);

    if (result.deletedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado" }
      };
      return;
    }

    // Limpiar colecciones relacionadas
    await Promise.all([
      db.collection("contacts").deleteMany({ _id_usuario: query._id_usuario || userId }),
      db.collection("geocercas").deleteMany({ _id_usuario: query._id_usuario || userId }),
      db.collection("llamadas").deleteMany({ _id_usuario: query._id_usuario || userId }),
      db.collection("notificaciones").deleteMany({ _id_usuario: query._id_usuario || userId }),
      db.collection("ubicaciones").deleteMany({ _id_usuario: query._id_usuario || userId })
    ]);

    context.res = {
      status: 200,
      body: { message: "Cuenta eliminada exitosamente" }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { message: "Error interno: " + error.message }
    };
  } finally {
    await client.close();
  }
};
