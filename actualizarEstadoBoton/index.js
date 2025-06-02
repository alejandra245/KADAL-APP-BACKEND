const axios = require("axios");
const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  const { _id_usuario, estado_boton_emergencia } = req.body;

  if (!_id_usuario || typeof estado_boton_emergencia !== "boolean") {
    context.res = {
      status: 400,
      body: "Faltan parámetros requeridos.",
    };
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("kadalDB");
    const kadal = db.collection("kadal");

    const result = await kadal.updateOne(
      { _id_usuario },
      { $set: { estado_boton_emergencia } }
    );

    if (result.matchedCount === 0) {
      context.res = {
        status: 404,
        body: "Dispositivo no encontrado"
      };
      return;
    }

    // 🔍 Buscar el documento actualizado
    const archivoKadal = await kadal.findOne({ _id_usuario });

    if (!archivoKadal) {
      context.res = {
        status: 404,
        body: "No se encontró el dispositivo actualizado"
      };
      return;
    }

    // Preparar el JSON para enviar al ESP32
    const archivoParaDispositivo = {
      _id_usuario: archivoKadal._id_usuario,
      estado_boton_emergencia: archivoKadal.estado_boton_emergencia
    };

    // Enviar el JSON al ESP32 usando la función enviarIoTHub
    try {
      const payload = {
        accion: "actualizarEstadoBoton",
        kadal: archivoParaDispositivo
      };

      await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
      context.log("Archivo KADAL enviado al dispositivo:", archivoKadal._id_usuario);
    } catch (axiosError) {
      context.log.warn("No se pudo enviar el archivo KADAL al dispositivo:", axiosError.message);
    }


    context.res = {
      status: 200,
      body: {
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "Error al actualizar el estado.",
        error: error.message,
      },
    };
  } finally {
    await client.close();
  }
};
