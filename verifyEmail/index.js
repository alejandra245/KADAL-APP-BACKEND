const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function (context, req) {
  const token = req.query.token;

  if (!token) {
    context.res = {
      status: 400,
      body: "Token no proporcionado"
    };
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    // Buscamos que el usuario tenga ese token (esto evita que alguien reutilice un token inválido)
    const user = await users.findOne({ _id: new ObjectId(userId), token });

    if (!user) {
      context.res = {
        status: 400,
        body: "No se encontró el usuario o el token no es válido"
      };
      return;
    }

    if (user.verificado) {
      context.res = {
        status: 400,
        body: "El usuario ya ha sido verificado"
      };
      return;
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verificado: true }, $unset: { token: "" } }
    );

    context.res = {
      status: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <html>
          <head><title>Cuenta verificada</title></head>
          <body style="text-align: center; font-family: sans-serif;">
            <h1>✅ Cuenta verificada exitosamente</h1>
            <p>Ya puedes iniciar sesión desde la app.</p>
          </body>
        </html>
      `
    };
  } catch (error) {
    context.log("Error en verificación:", error.message);
    context.res = {
      status: 400,
      body: "Token inválido o expirado"
    };
  }
};
