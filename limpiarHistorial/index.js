const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "DELETE") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { userId, kadalId } = req.query;

  if (!userId || !ObjectId.isValid(userId) || !kadalId) {
    context.res = {
      status: 400,
      body: { message: "Parámetros 'userId' o 'kadalId' inválidos o faltantes" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");

    const configuracion = db.collection("configuracionHistorial");
    const historial = db.collection("ubicaciones");

    const config = await configuracion.findOne({
      _id_usuario: new ObjectId(userId),
      _id_kadal: kadalId,
    });

    if (!config || !config.dias) {
      context.res = {
        status: 404,
        body: { message: "No se encontró configuración de historial para este usuario" },
      };
      return;
    }

    const dias = config.dias;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const resultado = await historial.deleteMany({
      _id_usuario: new ObjectId(userId),
      _id_kadal: kadalId,
      fecha: { $lt: fechaLimite },
    });

    context.res = {
      status: 200,
      body: {
        message: `🧹 Se eliminaron ${resultado.deletedCount} registros anteriores a ${dias} días`,
      },
    };

    await client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "❌ Error al limpiar historial",
        error: error.message,
      },
    };
  }
};
