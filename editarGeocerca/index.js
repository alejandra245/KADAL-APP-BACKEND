const axios = require("axios");
const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  console.log("Editar geocerca: request body ->", req.body);

  if (req.method !== "PUT") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const { _id, nombre, radio } = req.body;

  if (!_id || (!nombre && typeof radio === "undefined")) {
    context.res = {
      status: 400,
      body: { message: "Faltan campos obligatorios" },
    };
    return;
  }

  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");
    const geocercas = db.collection("geocercas");

    const updateFields = {};
    if (nombre) updateFields.nombre = nombre;
    if (typeof radio !== "undefined") updateFields.radio = parseInt(radio);

    console.log("🛠️ Actualizando:", _id, "con:", updateFields);

    const objectId = new ObjectId(_id);

    const updateResult = await geocercas.updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    console.log("🔧 Resultado updateOne:", updateResult);

    if (updateResult.matchedCount === 0) {
      context.res = {
        status: 404,
        body: { message: "No se encontró la geocerca" },
      };
      await client.close();
      return;
    }

    // 🔍 Buscar el documento actualizado (así nos aseguramos de obtener todos los campos)
    const geocercaActualizada = await geocercas.findOne({ _id: objectId });

    if (!geocercaActualizada) {
      context.res = {
        status: 404,
        body: { message: "No se encontró la geocerca actualizada" },
      };
      await client.close();
      return;
    }

    // Preparar el JSON para el ESP32
    const geocercaEditada = {
      _id_geocerca: geocercaActualizada._id_geocerca || "",
      _id_usuario: geocercaActualizada._id_usuario || "",
      nombre: geocercaActualizada.nombre || "",
      centro: geocercaActualizada.centro || {},
      radio: geocercaActualizada.radio || 0
    };

    try {
      const payload = {
        accion: "editarGeocerca",
        geocerca: geocercaEditada
      };

      await axios.post(process.env.URL_ENVIAR_IOT_HUB, payload);
      context.log("Geocerca editada enviada al dispositivo:", geocercaEditada._id_geocerca);
    } catch (axiosError) {
      context.log.warn("No se pudo enviar la geocerca editada al dispositivo:", axiosError.message);
    }

    context.res = {
      status: 200,
      body: { message: "Geocerca actualizada correctamente" },
    };

    await client.close();
  } catch (error) {
    console.error("Error al actualizar:", error);
    context.res = {
      status: 500,
      body: { message: "Error al actualizar geocerca", error: error.message },
    };
  }
};
