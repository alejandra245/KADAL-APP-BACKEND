const { MongoClient } = require("mongodb");
const axios = require("axios");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const idContacto = context.bindingData.contactId;

  if (!idContacto) {
    context.res = {
      status: 400,
      body: "Falta el ID del contacto (_id_contacto)"
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const contactos = db.collection("contacts");

    // Buscar el contacto antes de eliminarlo
    const contacto = await contactos.findOne({ _id_contacto: idContacto });

    if (!contacto) {
      context.res = {
        status: 404,
        body: "Contacto no encontrado"
      };
      return;
    }

    //  Enviar el contacto al ESP32
    try {
      const payload = {
        accion: "eliminarCtcEmg",
        ctcEmg: {
          _id_usuario: contacto._id_usuario,
          _id_contacto: contacto._id_contacto
        }
      };

      await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
      context.log(" Contacto eliminado enviado al dispositivo:", payload.ctcEmg._id_contacto);
    } catch (axiosError) {
      context.log.warn("No se pudo enviar el contacto eliminado al dispositivo:", axiosError.message);
      // Se decide continuar para no bloquear la eliminación
    }

    //  Eliminar el contacto
    const result = await contactos.deleteOne({ _id_contacto: idContacto });

    if (result.deletedCount === 0) {
      context.res = {
        status: 404,
        body: "El contacto no pudo eliminarse (ya no existe)"
      };
    } else {
      context.res = {
        status: 200,
        body: "Contacto eliminado correctamente"
      };
    }
  } catch (error) {
    context.log("Error al eliminar contacto:", error);
    context.res = {
      status: 500,
      body: "Error del servidor"
    };
  } finally {
    await client.close();
  }
};
