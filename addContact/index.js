const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Método no permitido"
    };
    return;
  }

  const { _id_contacto, _id_usuario, _id_kadal, nombre, numero_telefonico } = req.body;

  if (!_id_contacto || !_id_usuario || !_id_kadal || !nombre || !numero_telefonico) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios (_id_contacto, _id_usuario, _id_kadal, nombre, numero_telefonico)"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    await contactos.insertOne({
      _id_contacto,
      _id_usuario,
      _id_kadal,
      nombre,
      numero_telefonico,
      fechaCreacion: new Date()
    });

    context.res = {
      status: 201,
      body: { message: "Contacto añadido correctamente" }
    };
  } catch (error) {
    context.log("Error al añadir contacto:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
