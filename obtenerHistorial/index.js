const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "GET") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const kadalId = req.query.kadalId?.trim();
  const userId = req.query.userId?.trim();

  if (!kadalId || !userId) {
    context.res = {
      status: 400,
      body: { message: "Faltan los parámetros kadalId o userId" },
    };
    return;
  }

  if (!ObjectId.isValid(userId)) {
    context.res = {
      status: 400,
      body: { message: "El userId no es un ObjectId válido" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");

    const configuracion = db.collection("configuracionHistorial");
    const historial = db.collection("ubicaciones");

    const config = await configuracion.findOne({
      _id_kadal: kadalId,
      _id_usuario: new ObjectId(userId),
    });

    const dias = config?.dias || 7;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const ubicaciones = await historial
      .find({
        _id_kadal: kadalId,
        _id_usuario: new ObjectId(userId),
        latitud: { $ne: "" },
        longitud: { $ne: "" },
        fecha: { $gte: fechaLimite },
      })
      .sort({ fecha: -1 })
      .toArray();

    context.res = {
      status: 200,
      body: ubicaciones,
    };

    await client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "Error al obtener historial",
        error: error.message,
      },
    };
  }
};
