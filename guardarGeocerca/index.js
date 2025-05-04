const { MongoClient, ObjectId } = require("mongodb");
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
      _id_usuario: new ObjectId(userId),  // <--- corrección clave
      nombre,
      centro: {
        latitud: parseFloat(centro.latitud),
        longitud: parseFloat(centro.longitud),
      },
      radio: parseInt(radio),
      fechaCreacion: new Date(),
    };

    await geocercas.insertOne(nuevaGeocerca);

    context.res = {
      status: 201,
      body: "Geocerca guardada correctamente",
    };
  } catch (error) {
    context.log("Error al guardar geocerca:", error);
    context.res = {
      status: 500,
      body: "Error al guardar la geocerca",
    };
  } finally {
    await client.close();
  }
};
