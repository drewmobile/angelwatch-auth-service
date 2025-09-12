// DynamoDB service for user data management
import {
    DynamoDBClient,
    PutItemCommand,
    GetItemCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
    ScanCommand
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand as DocQueryCommand, ScanCommand as DocScanCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config/environment';
import { User, UserRole, UpdateProfileRequest } from '../types/auth';

export class DynamoService {
    private client: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        // In Lambda, use IAM role - don't specify credentials
        const dynamoClient = new DynamoDBClient({
            region: config.awsRegion
        });
        this.client = DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = config.dynamodbUsersTable;
    }

    /**
     * Create a new user in DynamoDB
     */
    async createUser(user: User): Promise<User> {
        try {
            const now = new Date().toISOString();
            const userData = {
                ...user,
                createdAt: now,
                updatedAt: now,
                timestamp: now // For sorting
            };

            const command = new PutCommand({
                TableName: this.tableName,
                Item: userData,
                ConditionExpression: 'attribute_not_exists(userId)' // Prevent overwrites
            });

            await this.client.send(command);
            return userData;
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get user by userId
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: 'user' // Sort key for user records
                }
            });

            const response = await this.client.send(command);
            return response.Item as User || null;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const command = new DocQueryCommand({
                TableName: this.tableName,
                IndexName: 'email-index', // Assuming we have a GSI on email
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': email
                }
            });

            const response = await this.client.send(command);
            return response.Items?.[0] as User || null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update user profile
     */
    async updateUser(userId: string, updates: UpdateProfileRequest): Promise<User> {
        try {
            const updateExpressions: string[] = [];
            const expressionAttributeValues: Record<string, any> = {};
            const expressionAttributeNames: Record<string, string> = {};

            // Build update expression dynamically
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

            // Always update the updatedAt timestamp
            updateExpressions.push('#updatedAt = :updatedAt');
            expressionAttributeNames['#updatedAt'] = 'updatedAt';
            expressionAttributeValues[':updatedAt'] = new Date().toISOString();

            const command = new UpdateCommand({
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
            return response.Attributes as User;
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin(userId: string): Promise<void> {
        try {
            const command = new UpdateCommand({
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
        } catch (error) {
            console.error('Error updating last login:', error);
            throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete user
     */
    async deleteUser(userId: string): Promise<void> {
        try {
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: 'user'
                }
            });

            await this.client.send(command);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get users by school ID
     */
    async getUsersBySchool(schoolId: string): Promise<User[]> {
        try {
            const command = new DocQueryCommand({
                TableName: this.tableName,
                IndexName: 'school-index', // Assuming we have a GSI on schoolId
                KeyConditionExpression: 'schoolId = :schoolId',
                ExpressionAttributeValues: {
                    ':schoolId': schoolId
                }
            });

            const response = await this.client.send(command);
            return response.Items as User[] || [];
        } catch (error) {
            console.error('Error getting users by school:', error);
            throw new Error(`Failed to get users by school: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get users by role
     */
    async getUsersByRole(role: UserRole): Promise<User[]> {
        try {
            const command = new DocQueryCommand({
                TableName: this.tableName,
                IndexName: 'role-index', // Assuming we have a GSI on role
                KeyConditionExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': role
                }
            });

            const response = await this.client.send(command);
            return response.Items as User[] || [];
        } catch (error) {
            console.error('Error getting users by role:', error);
            throw new Error(`Failed to get users by role: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Search users (admin function)
     */
    async searchUsers(searchTerm: string, limit: number = 20): Promise<User[]> {
        try {
            const command = new DocScanCommand({
                TableName: this.tableName,
                FilterExpression: 'contains(email, :searchTerm) OR contains(firstName, :searchTerm) OR contains(lastName, :searchTerm)',
                ExpressionAttributeValues: {
                    ':searchTerm': searchTerm
                },
                Limit: limit
            });

            const response = await this.client.send(command);
            return (response.Items as User[]) || [];
        } catch (error) {
            console.error('Error searching users:', error);
            throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
