const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const kadalId = req.query.kadalId || "kadal-001"; // Ajusta según tu proyecto

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");

    const ultimaUbicacion = await db
      .collection("ubicaciones")
      .find({ _id_kadal: kadalId })
      .sort({ fecha: -1 })
      .limit(1)
      .toArray();

    if (ultimaUbicacion.length === 0) {
      context.res = {
        status: 404,
        body: { message: "No hay ubicación registrada para este KADAL." },
      };
      return;
    }

    const ubicacion = ultimaUbicacion[0];
    context.res = {
      status: 200,
      body: {
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        fecha: ubicacion.fecha,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: { message: "Error interno: " + error.message },
    };
  } finally {
    await client.close();
  }
};
