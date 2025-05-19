const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, IoTHubMessage) {
  const data = IoTHubMessage.body || IoTHubMessage;

  const {
    _id_llamada,
    _id_usuario,
    _id_kadal,
    tipo_llamada,
    duracion,
    numero_contacto,
    fecha
  } = data;

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");

    const usuarioObjectId = new ObjectId(_id_usuario);
    const fechaISO = new Date(fecha);

    // Verificar si el número pertenece a un contacto de emergencia
    const contacto = await db.collection("contacts").findOne({
      _id_usuario: usuarioObjectId,
      numero_telefonico: numero_contacto,
    });

    // Verificar si el número pertenece al tutor
    const usuario = await db.collection("users").findOne({
      _id: usuarioObjectId,
    });

    let mensaje = "";

    if (contacto) {
      mensaje = tipo_llamada === "entrante"
        ? "Llamada recibida desde contacto de emergencia"
        : "Llamada realizada a contacto de emergencia";
    } else if (usuario?.telefono === numero_contacto) {
      mensaje = tipo_llamada === "entrante"
        ? "Llamada recibida desde el tutor"
        : "Llamada realizada al tutor";
    } else {
      mensaje = tipo_llamada === "entrante"
        ? "Llamada entrante registrada"
        : "Llamada saliente registrada";
    }

    await db.collection("notificaciones").insertOne({
      _id_usuario: usuarioObjectId,
      _id_kadal,
      tipo: "llamada",
      mensaje,
      duracion,
      numero_contacto,
      tipo_llamada,
      fecha: fechaISO,
    });

    client.close();
  } catch (err) {
    context.log.error("❌ Error al guardar la notificación de llamada:", err);
  }
};
