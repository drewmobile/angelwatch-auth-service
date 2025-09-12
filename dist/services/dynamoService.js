"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const environment_1 = require("../config/environment");
class DynamoService {
    constructor() {
        const dynamoClient = new client_dynamodb_1.DynamoDBClient({
            region: environment_1.config.awsRegion
        });
        this.client = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = environment_1.config.dynamodbUsersTable;
    }
    async createUser(user) {
        try {
            const now = new Date().toISOString();
            const userData = {
                ...user,
                createdAt: now,
                updatedAt: now,
                timestamp: now
            };
            const command = new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: userData,
                ConditionExpression: 'attribute_not_exists(userId)'
            });
            await this.client.send(command);
            return userData;
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getUserById(userId) {
        try {
            const command = new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: 'user'
                }
            });
            const response = await this.client.send(command);
            return response.Item || null;
        }
        catch (error) {
            console.error('Error getting user by ID:', error);
            throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getUserByEmail(email) {
        try {
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': email
                }
            });
            const response = await this.client.send(command);
            return response.Items?.[0] || null;
        }
        catch (error) {
            console.error('Error getting user by email:', error);
            throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateUser(userId, updates) {
        try {
            const updateExpressions = [];
            const expressionAttributeValues = {};
            const expressionAttributeNames = {};
            if (updates.firstName) {
                updateExpressions.push('#firstName = :firstName');
                expressionAttributeNames['#firstName'] = 'firstName';
                expressionAttributeValues[':firstName'] = updates.firstName;
            }
            if (updates.lastName) {
                updateExpressions.push('#lastName = :lastName');
                expressionAttributeNames['#lastName'] = 'lastName';
                expressionAttributeValues[':lastName'] = updates.lastName;
            }
            if (updates.schoolId !== undefined) {
                updateExpressions.push('#schoolId = :schoolId');
                expressionAttributeNames['#schoolId'] = 'schoolId';
                expressionAttributeValues[':schoolId'] = updates.schoolId;
            }
            updateExpressions.push('#updatedAt = :updatedAt');
            expressionAttributeNames['#updatedAt'] = 'updatedAt';
            expressionAttributeValues[':updatedAt'] = new Date().toISOString();
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: 'user'
                },
                UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW'
            });
            const response = await this.client.send(command);
            return response.Attributes;
        }
        catch (error) {
            console.error('Error updating user:', error);
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateLastLogin(userId) {
        try {
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: 'user'
                },
                UpdateExpression: 'SET lastLoginAt = :lastLoginAt, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#updatedAt': 'updatedAt'
                },
                ExpressionAttributeValues: {
                    ':lastLoginAt': new Date().toISOString(),
                    ':updatedAt': new Date().toISOString()
                }
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error updating last login:', error);
            throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteUser(userId) {
        try {
            const command = new lib_dynamodb_1.DeleteCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: 'user'
                }
            });
            await this.client.send(command);
        }
        catch (error) {
            console.error('Error deleting user:', error);
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getUsersBySchool(schoolId) {
        try {
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'school-index',
                KeyConditionExpression: 'schoolId = :schoolId',
                ExpressionAttributeValues: {
                    ':schoolId': schoolId
                }
            });
            const response = await this.client.send(command);
            return response.Items || [];
        }
        catch (error) {
            console.error('Error getting users by school:', error);
            throw new Error(`Failed to get users by school: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getUsersByRole(role) {
        try {
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'role-index',
                KeyConditionExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': role
                }
            });
            const response = await this.client.send(command);
            return response.Items || [];
        }
        catch (error) {
            console.error('Error getting users by role:', error);
            throw new Error(`Failed to get users by role: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async searchUsers(searchTerm, limit = 20) {
        try {
            const command = new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName,
                FilterExpression: 'contains(email, :searchTerm) OR contains(firstName, :searchTerm) OR contains(lastName, :searchTerm)',
                ExpressionAttributeValues: {
                    ':searchTerm': searchTerm
                },
                Limit: limit
            });
            const response = await this.client.send(command);
            return response.Items || [];
        }
        catch (error) {
            console.error('Error searching users:', error);
            throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.DynamoService = DynamoService;
//# sourceMappingURL=dynamoService.js.map