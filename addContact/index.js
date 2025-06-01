const axios = require("axios");
const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Método no permitido"
    };
    return;
  }

  const { _id_contacto, _id_usuario, _id_kadal, nombre, numero_telefonico } = req.body;

  if (!_id_contacto || !_id_usuario || !_id_kadal || !nombre || !numero_telefonico) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios (_id_contacto, _id_usuario, _id_kadal, nombre, numero_telefonico)"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    const fechaActual = new Date().toISOString();

    const nuevoContacto = {
      _id_contacto,
      _id_usuario,
      _id_kadal,
      nombre,
      numero_telefonico,
      fechaCreacion: fechaActual,
      fechaActualizacion: fechaActual
    };

    await contactos.insertOne(nuevoContacto);

    try {
      const payload = {
        accion: "nuevoCtcEmg",
        ctcEmg: nuevoContacto
      };

      await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
      context.log(" Contacto enviado al dispositivo:", nuevoContacto._id_contacto);
    } catch (axiosError) {
      context.log.warn("No se pudo enviar el contacto de emergencia al dispositivo:", axiosError.message);
    }

    context.res = {
      status: 201,
      body: { message: "Contacto añadido correctamente" }
    };
  } catch (error) {
    context.log("Error al añadir contacto:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
