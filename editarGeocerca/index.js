const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "PUT") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id_geocerca, nombre, radio } = req.body;

  if (!_id_geocerca || !nombre || !radio) {
    context.res = {
      status: 400,
      body: { message: "Faltan campos obligatorios" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadal");
    const geocercas = db.collection("geocercas");

    await geocercas.updateOne(
      { _id_geocerca },
      { $set: { nombre, radio: parseInt(radio) } }
    );

    context.res = {
      status: 200,
      body: { message: "Geocerca actualizada correctamente" },
    };

    client.close();
  } catch (error) {
    context.res = {
      status: 500,
      body: { message: "Error al actualizar geocerca", error },
    };
  }
};
