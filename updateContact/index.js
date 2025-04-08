const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const contactId = context.bindingData.contactId;
  const { nombre, telefono } = req.body;

  if (!contactId) {
    context.res = {
      status: 400,
      body: "Falta el ID del contacto"
    };
    return;
  }

  if (!nombre || !telefono) {
    context.res = {
      status: 400,
      body: "Nombre y teléfono son requeridos"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    const result = await contactos.updateOne(
      { _id: new ObjectId(contactId) },
      { $set: { nombre, telefono } }
    );

    if (result.matchedCount === 0) {
      context.res = {
        status: 404,
        body: "Contacto no encontrado"
      };
    } else {
      context.res = {
        status: 200,
        body: "Contacto actualizado correctamente"
      };
    }
  } catch (error) {
    context.log("Error al actualizar contacto:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
