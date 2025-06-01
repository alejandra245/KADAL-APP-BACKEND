const iothub = require("azure-iothub");
const { Message } = require("azure-iot-common");

const iothubConnectionString = process.env.IOTHUB_CONNECTION_STRING;
const deviceId = "KADALESP32";  // Ajusta tu Device ID real

module.exports = async function (context, req) {
  const accion = req.body.accion;
  const geocerca = req.body.geocerca;

  if (!accion || !geocerca) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios: 'accion' y 'geocerca'."
    };
    return;
  }

  const serviceClient = iothub.Client.fromConnectionString(iothubConnectionString);

  const payload = {
    accion,
    geocerca
  };

  try {
    await serviceClient.open();
    const mensaje = new Message(JSON.stringify(payload));
    mensaje.contentType = "application/json";
    mensaje.contentEncoding = "utf-8";

    await serviceClient.send(deviceId, mensaje);
    context.log(`✅ Acción "${accion}" enviada al dispositivo:`, geocerca._id_geocerca);

    context.res = {
      status: 200,
      body: `Acción "${accion}" enviada al dispositivo correctamente`
    };
  } catch (err) {
    context.log.error("Error al enviar geocerca:", err.message);
    context.res = {
      status: 500,
      body: `Error al enviar la geocerca: ${err.message}`
    };
  } finally {
    await serviceClient.close();
  }
};
