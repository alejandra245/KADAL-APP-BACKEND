const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  context.log("Iniciando función guardarVinculacion...");

  const { _id_kadal, _id_usuario, telefono_kadal, estado_boton_emergencia } = req.body;

  if (!_id_kadal || !_id_usuario || !telefono_kadal) {
    context.log("Faltan datos obligatorios");
    context.res = {
      status: 400,
      body: { message: "Faltan datos obligatorios (_id_kadal, _id_usuario, telefono_kadal)" },
    };
    return;
  }

  const documento = {
    _id_kadal,
    _id_usuario,
    telefono_kadal,
    estado_boton_emergencia: estado_boton_emergencia || false,
  };

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const kadal = db.collection("kadal");

    const result = await kadal.insertOne(documento);

    context.log("Documento insertado con ID:", result.insertedId);

    context.res = {
      status: 200,
      body: {
        message: "Vinculación guardada correctamente",
        data: documento,
      },
    };
  } catch (error) {
    context.log("Error al guardar vinculación:", error.message || error);
    context.res = {
      status: 500,
      body: { message: "Error al guardar vinculación", error: error.message || error },
    };
  } finally {
    await client.close();
  }
};
