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

  const kadalId = req.query.kadalId;
  if (!kadalId) {
    context.res = {
      status: 400,
      body: { message: "Falta el parámetro kadalId" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");

    const historial = db.collection("ubicaciones");
    const configuracion = db.collection("configuracionHistorial");

    const config = await configuracion.findOne({ _id_kadal: kadalId });
    const dias = config?.dias || 7;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    console.log("🕒 Fecha límite:", fechaLimite.toISOString()); // <--- aquí

    const ubicaciones = await historial
      .find({
        _id_kadal: kadalId,
        latitud: { $ne: "" },
        longitud: { $ne: "" },
        fecha: { $gte: fechaLimite },  
      })
      .sort({ fecha: -1 }) 
      .toArray();

      console.log("📍 Ubicaciones encontradas:", ubicaciones);

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
