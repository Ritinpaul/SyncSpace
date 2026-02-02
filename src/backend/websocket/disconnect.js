const { DynamoDBClient, DeleteItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({});

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    // First, get the connection info to find the documentId
    const connResult = await client.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        PK: `CONN#${connectionId}`,
        SK: "META",
      }),
    }));

    // Delete connection record
    await client.send(new DeleteItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        PK: `CONN#${connectionId}`,
        SK: "META",
      }),
    }));

    // If we found the connection, also delete the document connection
    if (connResult.Item) {
      const connection = unmarshall(connResult.Item);
      await client.send(new DeleteItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: marshall({
          PK: `DOC#${connection.documentId}`,
          SK: `CONN#${connectionId}`,
        }),
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Disconnected" }),
    };
  } catch (error) {
    console.error("Error disconnecting:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to disconnect" }),
    };
  }
};
