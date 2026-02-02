const { DynamoDBClient, QueryCommand, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");

const dynamoClient = new DynamoDBClient({});

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  
  const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: `https://${domain}/${stage}`,
  });

  try {
    const body = JSON.parse(event.body);
    const { documentId, message, action, beforeText, afterText } = body;

    // 1. Get Sender's Role from DynamoDB
    const senderResult = await dynamoClient.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        PK: `CONN#${connectionId}`,
        SK: "META",
      }),
    }));

    if (!senderResult.Item) {
      throw new Error("Connection not found");
    }

    const sender = unmarshall(senderResult.Item);
    const role = sender.role || "Viewer";

    // 2. Role Logic
    if (action === "edit" || action === "lock") {
      if (role === "Viewer") {
        await apiGatewayClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ error: "Permission Denied: Viewers cannot edit." }),
        }));
        return { statusCode: 403, body: "Permission Denied" };
      }
    }

    // 3. Audit Logging (if it's an edit)
    if (action === "edit") {
        const timestamp = new Date().toISOString();
        const auditItem = {
            PK: `DOC#${documentId}`,
            SK: `AUDIT#${timestamp}#${sender.userId}`,
            documentId,
            userId: sender.userId,
            action,
            beforeText: beforeText || "",
            afterText: afterText || "",
            timestamp,
            role,
        };
        
        await dynamoClient.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: marshall(auditItem),
        }));
    }

    // 4. Broadcast to all connections
    const result = await dynamoClient.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `DOC#${documentId}` },
        ":sk": { S: "CONN#" },
      },
    }));

    const connections = result.Items?.map(item => unmarshall(item)) || [];

    const postCalls = connections.map(async (conn) => {
      try {
        await apiGatewayClient.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: JSON.stringify({
            action,
            message,
            documentId,
            senderId: connectionId,
            senderRole: role, // broadcast the role too
            timestamp: new Date().toISOString(),
          }),
        }));
      } catch (error) {
        if (error.statusCode === 410) {
          console.log(`Stale connection: ${conn.connectionId}`);
        } else {
          console.error(`Error posting to ${conn.connectionId}:`, error);
        }
      }
    });

    await Promise.all(postCalls);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Message processed" }),
    };
  } catch (error) {
    console.error("Error processing message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process message" }),
    };
  }
};
