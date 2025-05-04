const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "DELETE") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id_geocerca } = req.body;

  if (!_id_geocerca) {
    context.res = {
      status: 400,
      body: { message: "ID de la geocerca requerido" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadal");
    const geocercas = db.collection("geocercas");

    await geocercas.deleteOne({ _id_geocerca });

    context.res = {
      status: 200,
      body: { message: "Geocerca eliminada correctamente" },
    };

    client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: { message: "Error al eliminar geocerca", error },
    };
  }
};
