const { client, databaseId, containerId } = require("../../cosmosClient");

module.exports = async function (context, req) {
  try {
    const { id_usuario } = req.body;

    if (!id_usuario) {
      context.res = {
        status: 400,
        body: { message: "Falta el campo obligatorio: id_usuario" },
      };
      return;
    }

    const jsonParcial = {
      _id_usuario: id_usuario,
      estado_boton_emergencia: false,
      ble: {
        service_uuid: "ec5f3f14-b07e-410c-aedb-0bdc6279f29a",
        characteristic_uuid: "91a6007a-bd54-4cf6-aeca-812bcabfc41f",
        device_name: "KADAL-BLE"
      }
    };

    context.res = {
      status: 200,
      body: jsonParcial
    };
  } catch (error) {
    context.log("❌ Error al generar JSON de vinculación:", error.message);
    context.res = {
      status: 500,
      body: { message: "Error al generar JSON de vinculación" }
    };
  }
};
