const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

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

  if (!email || !password || !nombre || !telefono || !confirmPassword || !nombreNino) {
    context.res = {
      status: 400,
      body: { message: "Todos los campos son requeridos (email, password, nombre, telefono, confirmPassword, nombreNino)" }
    };
    return;
  }

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

    const _id_usuario = uuidv4(); // ✅ ahora usamos UUID como _id_usuario

    const userData = {
      _id_usuario,          // será el ID principal (string)
      email,
      password: hashedPassword,
      nombre,
      telefono,
      nombreNino,
      verificado: false,
      fechaCreacion: new Date()
    };

    const verificationToken = jwt.sign({ id: _id_usuario }, jwtSecret, { expiresIn: '1d' });

    userData.token = verificationToken;

    await users.insertOne(userData);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPass
      }
    });

    const verificationLink = `https://kadal-functions-app.azurewebsites.net/api/verifyemail?token=${verificationToken}`;

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
