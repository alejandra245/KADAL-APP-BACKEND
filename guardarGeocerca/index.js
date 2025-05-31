const axios = require("axios");
const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Método no permitido",
    };
    return;
  }

  const { userId, nombre, centro, radio } = req.body;

  if (!userId || !nombre || !centro || !centro.latitud || !centro.longitud || !radio) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios (userId, nombre, centro con latitud/longitud y radio)",
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const geocercas = db.collection("geocercas");

    const nuevaGeocerca = {
      _id_geocerca: uuidv4(),
      _id_usuario: userId,  // ✅ Usamos el string directamente
      nombre,
      centro: {
        latitud: parseFloat(centro.latitud),
        longitud: parseFloat(centro.longitud),
      },
      radio: parseInt(radio),
      fechaCreacion: new Date().toISOString(),
    };

    await geocercas.insertOne(nuevaGeocerca);

    try {
      await axios.post(process.env.URL_ENVIAR_IOT_HUB, nuevaGeocerca);
    } catch (axiosError) {
      context.log.warn("No se pudo enviar la geocerca al dispositivo:", axiosError.message);
    }


    context.res = {
      status: 201,
      body: "Geocerca guardada correctamente",
    };
  } catch (error) {
    context.log.error("Error al guardar geocerca:", error.message);
    context.log.error("Stack trace:", error.stack);
    context.res = {
      status: 500,
      body: `Error al guardar la geocerca: ${error.message}`
    };
  } finally {
    await client.close();
  }
};
