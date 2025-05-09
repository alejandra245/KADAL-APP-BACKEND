const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id_kadal, dias } = req.body;

  if (!_id_kadal || !dias || typeof dias !== "number") {
    context.res = {
      status: 400,
      body: { message: "Faltan campos obligatorios o el tipo es inválido" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const configuracion = db.collection("configuracionHistorial");

    await configuracion.updateOne(
      { _id_kadal },
      { $set: { dias } },
      { upsert: true }
    );

    context.res = {
      status: 200,
      body: { message: "Configuración actualizada correctamente" },
    };

    client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: { message: "Error al guardar configuración", error: error.message },
    };
  }
};
