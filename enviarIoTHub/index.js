const iothub = require("azure-iothub");
const { Message } = require("azure-iot-common");

const iothubConnectionString = process.env.IOTHUB_CONNECTION_STRING;
const deviceId = "KADALESP32";  
module.exports = async function (context, req) {
  const accion = req.body.accion;
  
  // Puede ser "geocerca" o "ctcEmg" (contacto de emergencia)
  const geocerca = req.body.geocerca;
  const ctcEmg = req.body.ctcEmg;

  if (!accion || (!geocerca && !ctcEmg)) {
    context.res = {
      status: 400,
      body: "Faltan campos obligatorios: 'accion' y al menos uno de 'geocerca' o 'ctcEmg'."
    };
    return;
  }

  const serviceClient = iothub.Client.fromConnectionString(iothubConnectionString);

  const payload = {
    accion
  };

  if (geocerca) {
    payload.geocerca = geocerca;
  }

  if (ctcEmg) {
    payload.ctcEmg = ctcEmg;
  }

  try {
    await serviceClient.open();
    const mensaje = new Message(JSON.stringify(payload));
    mensaje.contentType = "application/json";
    mensaje.contentEncoding = "utf-8";

    await serviceClient.send(deviceId, mensaje);
    context.log(` Acción "${accion}" enviada al dispositivo`);

    context.res = {
      status: 200,
      body: `Acción "${accion}" enviada al dispositivo correctamente`
    };
  } catch (err) {
    context.log.error("Error al enviar mensaje al dispositivo:", err.message);
    context.res = {
      status: 500,
      body: `Error al enviar la acción al dispositivo: ${err.message}`
    };
  } finally {
    await serviceClient.close();
  }
};
