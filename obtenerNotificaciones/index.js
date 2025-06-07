const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  if (req.method !== "GET") {
    context.res = {
      status: 405,
      body: { message: "Método no permitido" },
    };
    return;
  }

  const userId = req.query.userId;
  if (!userId) {
    context.res = {
      status: 400,
      body: { message: "Falta el parámetro userId" },
    };
    return;
  }

  let client;

  try {
    client = await MongoClient.connect(uri);
    const db = client.db("kadalDB");

    // Obtener notificaciones
    const notificaciones = await db
      .collection("notificaciones")
      .find({ _id_usuario: userId })
      .toArray();

    const notificacionesConTipo = notificaciones.map(n => ({
      ...n,
      tipo: n.tipo || "notificacion",
      mensaje: n.mensaje || "",
      fecha: n.fecha instanceof Date
        ? n.fecha.toISOString()
        : n.fecha,
    }));

    // Obtener llamadas
    const llamadas = await db
      .collection("llamadas")
      .find({ _id_usuario: userId })
      .toArray();

    const llamadasConTipo = llamadas.map(l => {
      // Definir mensaje dinámico según tipo_llamada
      let mensaje = "Se realizó una llamada.";
      if (l.tipo_llamada && l.tipo_llamada.toLowerCase() === "entrante") {
        mensaje = "Se recibió una llamada.";
      }
      return {
        ...l,
        tipo: "llamada",  //  se agrega para que el frontend lo pinte
        mensaje: mensaje,
        fecha: l.fecha instanceof Date
          ? l.fecha.toISOString()
          : l.fecha,
      };
    });

    // Combinar y ordenar
    const eventos = [...notificacionesConTipo, ...llamadasConTipo];
    eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    context.res = {
      status: 200,
      body: eventos,
    };

  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: "Error al obtener eventos",
        error: error.message,
      },
    };
  } finally {
    if (client) await client.close();
  }
};
