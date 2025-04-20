const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;
const EMAIL_USER = process.env.SENDER_EMAIL;
const EMAIL_PASS = process.env.SENDER_PASS;

function generateTemporaryPassword(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

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

    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await users.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

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
      subject: "Recuperación de contraseña temporal - KADAL",
      html: `
        <h2>Hola ${user.nombre}</h2>
        <p>Se ha generado una contraseña temporal para que puedas ingresar a tu cuenta:</p>
        <p style="font-size: 20px; font-weight: bold; color: #6c63ff;">${tempPassword}</p>
        <p>Por seguridad, te recomendamos cambiar esta contraseña desde tu perfil una vez inicies sesión.</p>
        <br/>
        <p>Si no solicitaste esto, puedes ignorar este mensaje.</p>
      `,
    });

    context.res = {
      status: 200,
      body: { message: "Contraseña temporal enviada al correo" },
    };
  } catch (error) {
    context.log("Error en resetPasswordRequest:", error);
    context.res = {
      status: 500,
      body: { message: "Error al generar la contraseña temporal" },
    };
  } finally {
    await client.close();
  }
};
