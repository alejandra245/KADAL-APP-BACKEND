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

  const { userId, nombre, telefono } = req.body;

  if (!userId || !nombre || !telefono) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios (userId, nombre, telefono)"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    await contactos.insertOne({
      userId,
      nombre,
      telefono,
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
