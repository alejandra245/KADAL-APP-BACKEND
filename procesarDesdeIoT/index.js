const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, IoTHubMessages) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");

    for (const msg of IoTHubMessages) {
      const data = msg.body || msg;

      //  Mantener userId como string
      const userId = data._id_usuario || null;
      const fecha = data.fecha ? new Date(data.fecha) : new Date();

      if (data._id_ubicacion) {
        await db.collection("ubicaciones").insertOne({
          ...data,
          _id_usuario: userId,
          fecha,
        });
        context.log(` Ubicación registrada: ${data._id_ubicacion}`);
      
      } else if (data._id_notificacion) {
        await db.collection("notificaciones").insertOne({
          ...data,
          _id_usuario: userId,
          fecha,
        });
        context.log(` Notificación registrada: ${data._id_notificacion}`);
      
      } else if (data._id_llamada) {
        await db.collection("llamadas").insertOne({
          ...data,
          _id_usuario: userId,
          fecha,
        });
        context.log(` Llamada registrada: ${data._id_llamada}`);
      
      } else {
        context.log.warn(" Mensaje no reconocido:", data);
      }
    }

  } catch (err) {
    context.log.error(" Error al procesar datos desde IoT:", err);
  } finally {
    await client.close();
  }
};
