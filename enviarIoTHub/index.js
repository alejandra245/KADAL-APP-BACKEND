const iothub = require("azure-iothub");
const { Message } = require("azure-iot-common");  // 🟢 Aquí importa Message correctamente

const iothubConnectionString = process.env.IOTHUB_CONNECTION_STRING;
const deviceId = "KADALESP32";  // Ajusta el ID real de tu dispositivo

module.exports = async function (context, req) {
  const geocerca = req.body;

  const serviceClient = iothub.Client.fromConnectionString(iothubConnectionString);

  const payload = {
    accion: "nuevaGeocerca",
    geocerca
  };

  try {
    await serviceClient.open();
    const mensaje = new Message(JSON.stringify(payload));
    mensaje.contentType = "application/json";
    mensaje.contentEncoding = "utf-8";

    await serviceClient.send(deviceId, mensaje);
    context.log("✅ Geocerca enviada al dispositivo:", geocerca._id_geocerca);

    context.res = {
      status: 200,
      body: "Geocerca enviada al dispositivo correctamente"
    };
  } catch (err) {
    context.log.error("❌ Error al enviar geocerca:", err.message);
    context.res = {
      status: 500,
      body: `Error al enviar la geocerca: ${err.message}`
    };
  } finally {
    await serviceClient.close();
  }
};
