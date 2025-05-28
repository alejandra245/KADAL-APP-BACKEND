const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  console.log(" Editar geocerca: request body ->", req.body);

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

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const geocercas = db.collection("geocercas");

    const updateFields = {};
    if (nombre) updateFields.nombre = nombre;
    if (typeof radio !== "undefined") updateFields.radio = parseInt(radio);

    console.log("🛠️ Actualizando:", _id, "con:", updateFields);

    const result = await geocercas.updateOne(
      { _id },
      { $set: updateFields }
    );

    console.log("🔧 Resultado updateOne:", result);

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
    console.error("Error al actualizar:", error);
    context.res = {
      status: 500,
      body: { message: "Error al actualizar geocerca", error: error.message },
    };
  }
};
