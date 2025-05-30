const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "GET") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const userId = req.query.userId;
  if (!userId) {
    context.res = {
      status: 400,
      body: { message: "Falta el parámetro userId" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const notificacionesCol = db.collection("notificaciones");

    //  Buscar por ID string (sin usar ObjectId)
    const notificaciones = await notificacionesCol
      .find({ _id_usuario: userId })
      .sort({ _id_notificacion: 1 })
      .toArray();

    //  Convertir fechas a ISO
    const notificacionesConFechaISO = notificaciones.map(n => ({
      ...n,
      fecha: n.fecha instanceof Date ? n.fecha.toISOString() : n.fecha,
    }));

    context.res = {
      status: 200,
      body: notificacionesConFechaISO,
    };

    client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "Error al obtener notificaciones",
        error: error.message,
      },
    };
  }
};
