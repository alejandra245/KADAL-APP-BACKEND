const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const kadalId = req.query.kadalId || "kadal-001";  // ID del dispositivo
  const userId = req.query.userId;                  // ID del usuario

  if (!userId) {
    context.res = {
      status: 400,
      body: { message: "Falta el parámetro userId." },
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");

    const ultimaUbicacion = await db
      .collection("ubicaciones")
      .find({ _id_kadal: kadalId, _id_usuario: userId }) // 🔑 Filtrar por usuario
      .sort({ fecha: -1 })
      .limit(1)
      .toArray();

      if (ultimaUbicacion.length === 0) {
        context.res = {
          status: 200,
          body: { 
            sinUbicacion: true, 
            message: "No hay ubicación registrada para este usuario." 
          },
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
