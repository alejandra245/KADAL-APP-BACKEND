const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const idUsuario = req.query.id;

  if (!idUsuario) {
    context.res = {
      status: 400,
      body: "Falta el parámetro 'id'",
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const kadal = db.collection("kadal");

    const doc = await kadal.findOne({ _id_usuario: idUsuario });

    if (!doc) {
      context.res = {
        status: 200,
        body: {
          estado_boton_emergencia: false,
          sinEstado: true,
          message: "Dispositivo no encontrado. Asumiendo botón desactivado por defecto."
        },
      };
      return;
    }

    context.res = {
      status: 200,
      body: {
        estado_boton_emergencia: doc.estado_boton_emergencia ?? false,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "Error interno",
        error: error.message,
      },
    };
  } finally {
    await client.close();
  }
};
