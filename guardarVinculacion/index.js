const { client, databaseId, containerId } = require("../../cosmosClient");

module.exports = async function (context, req) {
  try {
    const { _id_kadal, _id_usuario, telefono_kadal, estado_boton_emergencia } = req.body;

    if (!_id_kadal || !_id_usuario || !telefono_kadal) {
      context.res = {
        status: 400,
        body: { message: "Faltan datos obligatorios" },
      };
      return;
    }

    const documento = {
      _id_kadal,
      _id_usuario,
      telefono_kadal,
      estado_boton_emergencia: estado_boton_emergencia || false
    };

    const container = client.database(databaseId).container(containerId);
    await container.items.create(documento);

    context.res = {
      status: 200,
      body: { message: " Vinculación guardada correctamente", data: documento }
    };
  } catch (error) {
    context.log(" Error al guardar vinculación:", error.message);
    context.res = {
      status: 500,
      body: { message: "Error al guardar vinculación" }
    };
  }
};
