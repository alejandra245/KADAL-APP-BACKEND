const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const databaseId = "kadalDB";
const containerId = "kadal";

module.exports = { client, databaseId, containerId };
