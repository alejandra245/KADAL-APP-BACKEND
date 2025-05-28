const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, myTimer) {
  const now = new Date();
  const sieteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const notificacionesCol = db.collection("notificaciones");

    const resultado = await notificacionesCol.deleteMany({
      fecha: { $lt: sieteDiasAtras },
    });

    context.log(` Notificaciones eliminadas: ${resultado.deletedCount}`);
    await client.close();
  } catch (err) {
    context.log.error(" Error limpiando notificaciones:", err.message);
  }
};
