"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
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
                userId: user.userId || generateId(),
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
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                },
                Limit: 1
            });
            const response = await this.client.send(command);
            return response.Items?.[0] || null;
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
            const existingUser = await this.getUserById(userId);
            if (!existingUser) {
                throw new Error('User not found');
            }
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
                    timestamp: existingUser.timestamp || existingUser.createdAt
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
            const existingUser = await this.getUserById(userId);
            if (!existingUser) {
                throw new Error('User not found');
            }
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: existingUser.timestamp || existingUser.createdAt
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
            const existingUser = await this.getUserById(userId);
            if (!existingUser) {
                throw new Error('User not found');
            }
            const command = new lib_dynamodb_1.DeleteCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: existingUser.timestamp || existingUser.createdAt
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
    async getSystemStats() {
        try {
            const usersResponse = await this.client.send(new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName,
                Select: 'COUNT'
            }));
            const totalUsers = usersResponse.Count || 0;
            const activeUsersResponse = await this.client.send(new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName,
                FilterExpression: 'isActive = :active',
                ExpressionAttributeValues: {
                    ':active': true
                },
                Select: 'COUNT'
            }));
            const activeUsers = activeUsersResponse.Count || 0;
            return {
                totalSchools: 25,
                totalUsers,
                activeUsers,
                totalCourses: 15,
                completedCourses: 3456,
                totalWatchTime: 12450,
                supportTickets: 23,
                systemUptime: 99.9
            };
        }
        catch (error) {
            console.error('Error getting system stats:', error);
            throw new Error(`Failed to get system stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllSchools() {
        try {
            return [
                {
                    schoolId: 'school-1',
                    name: 'Lincoln Elementary School',
                    district: 'Springfield School District',
                    address: '123 Main St',
                    city: 'Springfield',
                    state: 'IL',
                    zipCode: '62701',
                    phone: '(217) 555-0123',
                    email: 'admin@lincoln-elementary.edu',
                    contactPerson: 'John Smith',
                    licenseType: 'school',
                    maxUsers: 50,
                    activeUsers: 32,
                    isActive: true,
                    subscriptionStatus: 'active',
                    subscriptionEndDate: '2025-12-31T23:59:59Z',
                    createdAt: '2024-01-15T10:00:00Z',
                    updatedAt: '2024-09-13T15:30:00Z'
                },
                {
                    schoolId: 'school-2',
                    name: 'Washington High School',
                    district: 'Springfield School District',
                    address: '456 Oak Ave',
                    city: 'Springfield',
                    state: 'IL',
                    zipCode: '62702',
                    phone: '(217) 555-0456',
                    email: 'admin@washington-high.edu',
                    contactPerson: 'Sarah Johnson',
                    licenseType: 'school',
                    maxUsers: 100,
                    activeUsers: 78,
                    isActive: true,
                    subscriptionStatus: 'trial',
                    subscriptionEndDate: '2024-12-31T23:59:59Z',
                    createdAt: '2024-02-20T14:00:00Z',
                    updatedAt: '2024-09-13T16:45:00Z'
                }
            ];
        }
        catch (error) {
            console.error('Error getting schools:', error);
            throw new Error(`Failed to get schools: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateSchoolStatus(schoolId, isActive) {
        try {
            const schools = await this.getAllSchools();
            const school = schools.find(s => s.schoolId === schoolId);
            if (!school) {
                throw new Error('School not found');
            }
            school.isActive = isActive;
            school.updatedAt = new Date().toISOString();
            return school;
        }
        catch (error) {
            console.error('Error updating school status:', error);
            throw new Error(`Failed to update school status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllUsersWithActivity() {
        try {
            const response = await this.client.send(new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName
            }));
            const users = response.Items || [];
            return users.map(user => ({
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                schoolId: user.schoolId,
                schoolName: user.schoolId ? `School ${user.schoolId}` : undefined,
                lastLoginAt: user.lastLoginAt,
                loginCount: Math.floor(Math.random() * 50) + 1,
                coursesCompleted: Math.floor(Math.random() * 10),
                totalWatchTime: Math.floor(Math.random() * 500) + 10,
                isActive: user.isActive,
                createdAt: user.createdAt
            }));
        }
        catch (error) {
            console.error('Error getting users with activity:', error);
            throw new Error(`Failed to get users with activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateUserStatus(userId, isActive) {
        try {
            const existingUser = await this.getUserById(userId);
            if (!existingUser) {
                throw new Error('User not found');
            }
            const now = new Date().toISOString();
            const command = new lib_dynamodb_1.UpdateCommand({
                TableName: this.tableName,
                Key: {
                    userId,
                    timestamp: existingUser.timestamp || existingUser.createdAt
                },
                UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':isActive': isActive,
                    ':updatedAt': now
                },
                ReturnValues: 'ALL_NEW'
            });
            const response = await this.client.send(command);
            return response.Attributes;
        }
        catch (error) {
            console.error('Error updating user status:', error);
            throw new Error(`Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSupportTickets() {
        try {
            return [
                {
                    ticketId: 'ticket-1',
                    userId: 'user-1',
                    userEmail: 'teacher@lincoln-elementary.edu',
                    userName: 'Jane Doe',
                    schoolId: 'school-1',
                    schoolName: 'Lincoln Elementary School',
                    subject: 'Cannot access training videos',
                    description: 'I am unable to play the training videos. They keep loading indefinitely.',
                    priority: 'high',
                    status: 'open',
                    category: 'technical',
                    createdAt: '2024-09-13T10:30:00Z',
                    updatedAt: '2024-09-13T10:30:00Z'
                },
                {
                    ticketId: 'ticket-2',
                    userId: 'user-2',
                    userEmail: 'admin@washington-high.edu',
                    userName: 'Mike Wilson',
                    schoolId: 'school-2',
                    schoolName: 'Washington High School',
                    subject: 'Need help with bulk user creation',
                    description: 'We have 50 new teachers starting next week. Can you help us set up their accounts?',
                    priority: 'medium',
                    status: 'in_progress',
                    category: 'training',
                    assignedTo: 'support@angelwatchedu.org',
                    createdAt: '2024-09-12T14:15:00Z',
                    updatedAt: '2024-09-13T09:20:00Z'
                }
            ];
        }
        catch (error) {
            console.error('Error getting support tickets:', error);
            throw new Error(`Failed to get support tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateSupportTicket(ticketId, status, assignedTo) {
        try {
            const tickets = await this.getSupportTickets();
            const ticket = tickets.find(t => t.ticketId === ticketId);
            if (!ticket) {
                throw new Error('Support ticket not found');
            }
            ticket.status = status;
            if (assignedTo) {
                ticket.assignedTo = assignedTo;
            }
            ticket.updatedAt = new Date().toISOString();
            if (status === 'resolved' || status === 'closed') {
                ticket.resolvedAt = new Date().toISOString();
            }
            return ticket;
        }
        catch (error) {
            console.error('Error updating support ticket:', error);
            throw new Error(`Failed to update support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSchoolById(schoolId) {
        try {
            const command = new lib_dynamodb_1.QueryCommand({
                TableName: 'angelwatch-production-schools',
                KeyConditionExpression: 'schoolId = :schoolId',
                ExpressionAttributeValues: {
                    ':schoolId': schoolId
                },
                Limit: 1
            });
            const result = await this.client.send(command);
            if (!result.Items || result.Items.length === 0) {
                return null;
            }
            return result.Items[0];
        }
        catch (error) {
            console.error('Error getting school by ID:', error);
            throw new Error(`Failed to get school: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSchoolTeachers(schoolId) {
        try {
            const command = new client_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'SchoolIdIndex',
                KeyConditionExpression: 'schoolId = :schoolId',
                FilterExpression: 'role = :role',
                ExpressionAttributeValues: {
                    ':schoolId': { S: schoolId },
                    ':role': { S: 'teacher' }
                }
            });
            const result = await this.client.send(command);
            if (!result.Items) {
                return [];
            }
            return result.Items.map(item => this.unmarshallUser(item));
        }
        catch (error) {
            console.error('Error getting school teachers:', error);
            throw new Error(`Failed to get school teachers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    unmarshallUser(item) {
        return {
            userId: item.userId?.S || '',
            email: item.email?.S || '',
            firstName: item.firstName?.S || '',
            lastName: item.lastName?.S || '',
            role: item.role?.S || '',
            schoolId: item.schoolId?.S || '',
            isActive: item.isActive?.BOOL || false,
            emailVerified: item.emailVerified?.BOOL || false,
            createdAt: item.createdAt?.S || '',
            updatedAt: item.updatedAt?.S || '',
            cognitoSub: item.cognitoSub?.S || ''
        };
    }
    async getProspectsByState(stateCode) {
        try {
            const command = new lib_dynamodb_1.ScanCommand({
                TableName: 'angelwatch-production-prospects',
                FilterExpression: '#state = :state',
                ExpressionAttributeNames: {
                    '#state': 'state'
                },
                ExpressionAttributeValues: {
                    ':state': stateCode
                }
            });
            const response = await this.client.send(command);
            return response.Items || [];
        }
        catch (error) {
            console.error('Error getting prospects by state:', error);
            return [];
        }
    }
    unmarshallSchool(item) {
        return {
            schoolId: item.schoolId?.S || '',
            name: item.name?.S || '',
            address: item.address?.S || '',
            city: item.city?.S || '',
            state: item.state?.S || '',
            zipCode: item.zipCode?.S || '',
            phone: item.phone?.S || '',
            email: item.email?.S || '',
            licenseType: item.licenseType?.S || 'basic',
            maxUsers: item.maxUsers?.N ? parseInt(item.maxUsers.N) : 10,
            activeUsers: item.activeUsers?.N ? parseInt(item.activeUsers.N) : 0,
            subscriptionStatus: item.subscriptionStatus?.S || 'active',
            isActive: item.isActive?.BOOL || false,
            createdAt: item.createdAt?.S || '',
            updatedAt: item.updatedAt?.S || ''
        };
    }
}
exports.DynamoService = DynamoService;
//# sourceMappingURL=dynamoService.js.map