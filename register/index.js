const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;
const senderEmail = process.env.SENDER_EMAIL;
const senderPass = process.env.SENDER_PASS;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" }
    };
    return;
  }

  const { email, password, nombre, telefono, confirmPassword, nombreNino } = req.body;

  // Validar que todos los campos estén presentes
  if (!email || !password || !nombre || !telefono || !confirmPassword || !nombreNino) {
    context.res = {
      status: 400,
      body: { message: "Todos los campos son requeridos (email, password, nombre, telefono, confirmPassword, nombreNino)" }
    };
    return;
  }

  // Validaciones básicas
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    context.res = {
      status: 400,
      body: { message: "Formato de email inválido" }
    };
    return;
  }

  if (password.length < 8) {
    context.res = {
      status: 400,
      body: { message: "La contraseña debe tener al menos 8 caracteres" }
    };
    return;
  }

  if (password !== confirmPassword) {
    context.res = {
      status: 400,
      body: { message: "Las contraseñas no coinciden" }
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const users = db.collection("users");

    const userExists = await users.findOne({ email });
    if (userExists) {
      context.res = {
        status: 400,
        body: { message: "El usuario ya existe" }
      };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertResult = await users.insertOne({
      email,
      password: hashedPassword,
      nombre,
      telefono,
      nombreNino, // 👈 Aquí se guarda el nombre del niño
      fechaCreacion: new Date(),
      verificado: false
    });

    const userId = insertResult.insertedId;

    const verificationToken = jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1d' });

    await users.updateOne(
      { _id: userId },
      { $set: { token: verificationToken } }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPass
      }
    });

    const verificationLink = `http://192.168.0.14:7071/api/verifyEmail?token=${verificationToken}`;

    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Verifica tu cuenta",
      html: `
        <h3>Hola ${nombre}</h3>
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p><i>(Revisa también tu carpeta de SPAM)</i></p>
      `
    };

    await transporter.sendMail(mailOptions);

    context.res = {
      status: 201,
      body: {
        message: "Usuario registrado exitosamente. Verifica tu correo electrónico.",
        email,
        nombre
      }
    };
  } catch (error) {
    context.log("Error en registro:", error);
    context.res = {
      status: 500,
      body: { message: "Error en el servidor al registrar usuario" }
    };
  } finally {
    await client.close();
  }
};
