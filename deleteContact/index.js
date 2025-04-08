const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const contactId = context.bindingData.contactId;

  if (!contactId) {
    context.res = {
      status: 400,
      body: "Falta el ID del contacto"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    const result = await contactos.deleteOne({ _id: new ObjectId(contactId) });

    if (result.deletedCount === 0) {
      context.res = {
        status: 404,
        body: "Contacto no encontrado"
      };
    } else {
      context.res = {
        status: 200,
        body: "Contacto eliminado correctamente"
      };
    }
  } catch (error) {
    context.log("Error al eliminar contacto:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
