const { MongoClient, ObjectId } = require("mongodb");
const axios = require("axios");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  console.log("Eliminar geocerca: query ->", req.query);

  if (req.method !== "DELETE") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id } = req.query;

  if (!_id) {
    context.res = {
      status: 400,
      body: { message: "Falta el ID de la geocerca" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const geocercas = db.collection("geocercas");

    // 1️⃣ Buscar la geocerca antes de eliminarla
    const geocerca = await geocercas.findOne({ _id: new ObjectId(_id) });

    if (!geocerca) {
      context.res = {
        status: 404,
        body: { message: "Geocerca no encontrada" },
      };
      return;
    }

    // 2️⃣ Enviar la geocerca al ESP32
    try {
      const payload = {
        accion: "eliminarGeocerca",
        geocerca: {
          _id_usuario: geocerca._id_usuario,
          _id_geocerca: geocerca._id_geocerca
        }
      };

      await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
      context.log("✅ Geocerca enviada al dispositivo:", payload.geocerca._id_geocerca);
    } catch (axiosError) {
      context.log.warn("No se pudo enviar la geocerca eliminada al dispositivo:", axiosError.message);
      // ❗️ Puedes decidir abortar aquí o continuar. Yo sugiero continuar para no bloquear la eliminación
    }

    // 3️⃣ Ahora sí, eliminar la geocerca de la base de datos
    const result = await geocercas.deleteOne({ _id: new ObjectId(_id) });
    console.log("Resultado deleteOne:", result);

    if (result.deletedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "La geocerca no pudo eliminarse (ya no existe)" },
      };
    } else {
      context.res = {
        status: 200,
        body: { message: "Geocerca eliminada correctamente" },
      };
    }

    await client.close();
  } catch (error) {
    console.error("Error al eliminar:", error);
    context.res = {
      status: 500,
      body: { message: "Error al eliminar geocerca", error: error.message },
    };
  }
};
