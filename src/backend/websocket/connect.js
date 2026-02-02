const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { AdminListGroupsForUserCommand, CognitoIdentityProviderClient } = require("@aws-sdk/client-cognito-identity-provider");
const { marshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const timestamp = new Date().toISOString();
  
  // Extract documentId and userId from query string parameters
  const documentId = event.queryStringParameters?.documentId || "default";
  const userId = event.queryStringParameters?.userId || "anonymous"; // This is the Cognito 'sub'

  let role = "Viewer"; // Default role

  try {
    if (userId !== "anonymous" && process.env.USER_POOL_ID) {
      try {
        const groupsCommand = new AdminListGroupsForUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: userId,
        });
        const groupResult = await cognitoClient.send(groupsCommand);
        
        const groups = groupResult.Groups?.map(g => g.GroupName) || [];
        if (groups.includes("Admin")) role = "Admin";
        else if (groups.includes("Editor")) role = "Editor";
      } catch (err) {
        console.warn("Could not fetch user groups:", err);
      }
    }

    // Store connection in DynamoDB with role
    const item = {
      PK: `CONN#${connectionId}`,
      SK: "META",
      connectionId,
      documentId,
      userId,
      role,
      connectedAt: timestamp,
    };

    await client.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(item),
    }));

    // Also create a reverse lookup for document -> connections
    const docConnItem = {
      PK: `DOC#${documentId}`,
      SK: `CONN#${connectionId}`,
      connectionId,
      userId,
      role,
      connectedAt: timestamp,
    };

    await client.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(docConnItem),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Connected", role }),
    };
  } catch (error) {
    console.error("Error connecting:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to connect" }),
    };
  }
};
