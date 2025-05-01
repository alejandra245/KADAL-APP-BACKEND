const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Método no permitido",
    };
    return;
  }

  const { userId, kadalId } = req.body;

  if (!userId || !kadalId) {
    context.res = {
      status: 400,
      body: "Faltan userId o kadalId",
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { dispositivo_kadal: kadalId } }
    );

    if (result.modifiedCount === 1) {
      context.res = {
        status: 200,
        body: "Dispositivo KADAL vinculado correctamente.",
      };
    } else {
      context.res = {
        status: 404,
        body: "Usuario no encontrado o ya vinculado.",
      };
    }
  } catch (error) {
    context.log("Error:", error);
    context.res = {
      status: 500,
      body: "Error al vincular dispositivo.",
    };
  } finally {
    await client.close();
  }
};
