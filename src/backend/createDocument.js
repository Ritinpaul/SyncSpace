const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({});

module.exports.handler = async (event) => {
  try {
    const { title, content } = JSON.parse(event.body);
    const documentId = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `DOC#${documentId}`,
      SK: "METADATA",
      documentId,
      title,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const command = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(item),
    });

    await client.send(command);

    return {
      statusCode: 201,
      body: JSON.stringify({ documentId, message: "Document created successfully" }),
    };
  } catch (error) {
    console.error("Error creating document:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create document" }),
    };
  }
};
