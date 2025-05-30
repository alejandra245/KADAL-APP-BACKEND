const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const { _id_usuario, estado_boton_emergencia } = req.body;

  if (!_id_usuario || typeof estado_boton_emergencia !== "boolean") {
    context.res = {
      status: 400,
      body: "Faltan parámetros requeridos.",
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const kadal = db.collection("kadal");

    const result = await kadal.updateOne(
      { _id_usuario },
      { $set: { estado_boton_emergencia } }
    );

    context.res = {
      status: 200,
      body: {
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "Error al actualizar el estado.",
        error: error.message,
      },
    };
  } finally {
    await client.close();
  }
};
