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

  const { _id, nombre, radio } = req.body;

  if (!_id || (!nombre && typeof radio === "undefined")) {
    context.res = {
      status: 400,
      body: { message: "Faltan campos obligatorios" },
    };
    return;
  }

  if (!ObjectId.isValid(_id)) {
    context.res = {
      status: 400,
      body: { message: "ID de geocerca inválido" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const geocercas = db.collection("geocercas");

    const updateFields = {};
    if (nombre) updateFields.nombre = nombre;
    if (typeof radio !== "undefined") updateFields.radio = parseInt(radio);

    console.log("🛠️ Actualizando geocerca:", _id, updateFields);

    const result = await geocercas.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "No se encontró la geocerca o no hubo cambios" },
      };
    } else {
      context.res = {
        status: 200,
        body: { message: "Geocerca actualizada correctamente" },
      };
    }

    await client.close();
  } catch (error) {
    console.error("❌ Error al actualizar geocerca:", error);
    context.res = {
      status: 500,
      body: { message: "Error al actualizar geocerca", error: error.message },
    };
  }
};
