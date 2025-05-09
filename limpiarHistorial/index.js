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

  const { userId } = req.query;
  if (!userId || !ObjectId.isValid(userId)) {
    context.res = {
      status: 400,
      body: { message: "ID de usuario inválido o faltante" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");

    const usuarios = db.collection("usuarios");
    const historial = db.collection("historial");

    const usuario = await usuarios.findOne({ _id: new ObjectId(userId) });

    if (!usuario || !usuario.diasHistorial) {
      context.res = {
        status: 404,
        body: { message: "Usuario no encontrado o sin configuración de días" },
      };
      return;
    }

    const dias = parseInt(usuario.diasHistorial);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const resultado = await historial.deleteMany({
      _id_usuario: new ObjectId(userId),
      fechaHora: { $lt: fechaLimite.toISOString() },
    });

    context.res = {
      status: 200,
      body: {
        message: `Se eliminaron ${resultado.deletedCount} registros del historial`,
      },
    };

    await client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: { message: "Error al limpiar historial", error: error.message },
    };
  }
};
