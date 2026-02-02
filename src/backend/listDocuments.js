const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
    };

    try {
        // Get user ID from Cognito claims
        const userId = event.requestContext?.authorizer?.claims?.sub;
        
        if (!userId) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: "Unauthorized" })
            };
        }

        // Query all documents for this user
        const command = new QueryCommand({
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":sk": "DOC#"
            }
        });

        const result = await docClient.send(command);
        
        const documents = (result.Items || []).map(item => ({
            id: item.SK.replace("DOC#", ""),
            title: item.title || "Untitled",
            updatedAt: item.updatedAt || item.createdAt,
            createdAt: item.createdAt
        }));

        // Sort by updatedAt descending
        documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ documents })
        };
    } catch (error) {
        console.error("Error listing documents:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Failed to list documents" })
        };
    }
};
