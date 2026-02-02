const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({});

module.exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const command = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        PK: `DOC#${id}`,
        SK: "METADATA",
      }),
    });

    const result = await client.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Document not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(unmarshall(result.Item)),
    };
  } catch (error) {
    console.error("Error retrieving document:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve document" }),
    };
  }
};
