const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const userId = req.query.userId;

  if (!userId) {
    context.res = {
      status: 400,
      body: { error: "Falta el parámetro userId" },
    };
    return;
  }

  const client = new MongoClient(uri); // sin `useNewUrlParser` ni `useUnifiedTopology` (ya no son necesarios)

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const collection = db.collection("geocercas");

    const geocercas = await collection
      .find({ _id_usuario: new ObjectId(userId) })
      .toArray();

    context.res = {
      status: 200,
      body: geocercas,
    };
  } catch (error) {
    console.error("Error al obtener geocercas:", error);
    context.res = {
      status: 500,
      body: { error: "Error al obtener geocercas" },
    };
  } finally {
    await client.close();
  }
};
