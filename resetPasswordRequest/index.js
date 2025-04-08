const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.SENDER_EMAIL;
const EMAIL_PASS = process.env.SENDER_PASS;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { email } = req.body;

  if (!email) {
    context.res = {
      status: 400,
      body: { message: "El correo es obligatorio" },
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (!user) {
      context.res = {
        status: 404,
        body: { message: "No se encontró una cuenta con ese correo" },
      };
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "30m" });

    const resetUrl = `http://192.168.0.14:3000/reset-password?token=${token}`;


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"KADAL Soporte" <${EMAIL_USER}>`,
      to: email,
      subject: "Recuperar contraseña - KADAL",
      html: `
        <h2>Hola ${user.nombre}</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p><strong>Este enlace expirará en 30 minutos.</strong></p>
        <br/>
        <p>Si no solicitaste esto, puedes ignorar este mensaje.</p>
      `,
    });

    context.res = {
      status: 200,
      body: { message: "Correo enviado para restablecer contraseña" },
    };
  } catch (error) {
    context.log("Error en resetPasswordRequest:", error);
    context.res = {
      status: 500,
      body: { message: "Error al enviar el correo" },
    };
  } finally {
    await client.close();
  }
};
