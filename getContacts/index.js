const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const _id_usuario = context.bindingData.userId;

  if (!_id_usuario) {
    context.res = {
      status: 400,
      body: "Falta el userId en la ruta (_id_usuario)"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    // Buscar todos los contactos con ese _id_usuario
    const listaContactos = await contactos.find({ _id_usuario }).toArray();

    context.res = {
      status: 200,
      body: listaContactos
    };
  } catch (error) {
    context.log("Error al obtener contactos:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
