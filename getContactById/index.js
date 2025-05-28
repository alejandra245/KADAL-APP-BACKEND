const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const contactId = context.bindingData.contactId;

  if (!contactId) {
    context.res = {
      status: 400,
      body: "Falta el ID del contacto en la ruta"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    const contacto = await contactos.findOne({ _id: contactId });

    if (!contacto) {
      context.res = {
        status: 404,
        body: "Contacto no encontrado"
      };
      return;
    }

    context.res = {
      status: 200,
      body: contacto
    };
  } catch (error) {
    context.log("Error al obtener contacto:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
