const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  console.log(" Eliminar geocerca: query ->", req.query);

  if (req.method !== "DELETE") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id } = req.query;

  if (!_id || !ObjectId.isValid(_id)) {
    context.res = {
      status: 400,
      body: { message: "ID de la geocerca inválido o faltante" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const geocercas = db.collection("geocercas");

    console.log(" Intentando eliminar geocerca con ID:", _id);

    const result = await geocercas.deleteOne({ _id: new ObjectId(_id) });

    console.log(" Resultado deleteOne:", result);

    if (result.deletedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "Geocerca no encontrada" },
      };
    } else {
      context.res = {
        status: 200,
        body: { message: "Geocerca eliminada correctamente" },
      };
    }

    await client.close();
  } catch (error) {
    console.error(" Error al eliminar:", error);
    context.res = {
      status: 500,
      body: { message: "Error al eliminar geocerca", error: error.message },
    };
  }
};
