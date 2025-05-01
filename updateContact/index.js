const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const contactId = context.bindingData.contactId; // viene del path /updateContact/:contactId
  const { _id_usuario, _id_kadal, nombre, numero_telefonico } = req.body;

  if (!contactId) {
    context.res = {
      status: 400,
      body: "Falta el ID del contacto (_id_contacto)"
    };
    return;
  }

  if (!nombre || !numero_telefonico) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios: nombre, numero_telefonico"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    const result = await contactos.updateOne(
      { _id_contacto: contactId },
      {
        $set: {
          nombre,
          numero_telefonico,
          _id_usuario,
          _id_kadal,
          fechaActualizacion: new Date()
        }
      }
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
