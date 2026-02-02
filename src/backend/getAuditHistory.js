const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({});

module.exports.handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    // Query all audit records for this document
    const command = new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `DOC#${id}` },
        ":sk": { S: "AUDIT#" },
      },
      ScanIndexForward: false, // Newest first
    });

    const result = await client.send(command);

    const history = result.Items?.map(item => unmarshall(item)) || [];

    return {
      statusCode: 200,
      body: JSON.stringify(history),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      }
    };
  } catch (error) {
    console.error("Error retrieving audit history:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not retrieve audit history" }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    };
  }
};
