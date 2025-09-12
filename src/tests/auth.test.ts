// Basic tests for Auth Service
import { handler } from '../index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('Auth Service', () => {
    const mockContext: Context = {
        awsRequestId: 'test-request-id',
        functionName: 'test-function',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
        memoryLimitInMB: '128',
        logGroupName: 'test-log-group',
        logStreamName: 'test-log-stream',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn(),
        callbackWaitsForEmptyEventLoop: true
    };

    describe('CORS Handler', () => {
        it('should handle OPTIONS requests', async () => {
            const event: APIGatewayProxyEvent = {
                httpMethod: 'OPTIONS',
                path: '/auth/test',
                headers: {},
                body: null,
                isBase64Encoded: false,
                pathParameters: null,
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                multiValueHeaders: {},
                requestContext: {} as any,
                resource: '',
                stageVariables: null
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
            expect(result.headers?.['Access-Control-Allow-Methods']).toBe('GET,POST,PUT,DELETE,OPTIONS');
        });
    });

    describe('Register Handler', () => {
        it('should return 400 for missing required fields', async () => {
            const event: APIGatewayProxyEvent = {
                httpMethod: 'POST',
                path: '/auth/register',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com'
                    // Missing password, firstName, lastName, role
                }),
                isBase64Encoded: false,
                pathParameters: null,
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                multiValueHeaders: {},
                requestContext: {} as any,
                resource: '',
                stageVariables: null
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(false);
            expect(body.message).toContain('Missing required fields');
        });

        it('should return 400 for invalid role', async () => {
            const event: APIGatewayProxyEvent = {
                httpMethod: 'POST',
                path: '/auth/register',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'invalid_role'
                }),
                isBase64Encoded: false,
                pathParameters: null,
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                multiValueHeaders: {},
                requestContext: {} as any,
                resource: '',
                stageVariables: null
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(false);
            expect(body.message).toContain('Invalid role');
        });
    });

    describe('Login Handler', () => {
        it('should return 400 for missing credentials', async () => {
            const event: APIGatewayProxyEvent = {
                httpMethod: 'POST',
                path: '/auth/login',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com'
                    // Missing password
                }),
                isBase64Encoded: false,
                pathParameters: null,
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                multiValueHeaders: {},
                requestContext: {} as any,
                resource: '',
                stageVariables: null
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(false);
            expect(body.message).toContain('Missing required fields');
        });
    });

    describe('Protected Routes', () => {
        it('should return 401 for missing authorization header', async () => {
            const event: APIGatewayProxyEvent = {
                httpMethod: 'GET',
                path: '/auth/profile',
                headers: {},
                body: null,
                isBase64Encoded: false,
                pathParameters: null,
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                multiValueHeaders: {},
                requestContext: {} as any,
                resource: '',
                stageVariables: null
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(401);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(false);
            expect(body.message).toContain('token');
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const event: APIGatewayProxyEvent = {
                httpMethod: 'GET',
                path: '/unknown/route',
                headers: {},
                body: null,
                isBase64Encoded: false,
                pathParameters: null,
                queryStringParameters: null,
                multiValueQueryStringParameters: null,
                multiValueHeaders: {},
                requestContext: {} as any,
                resource: '',
                stageVariables: null
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(404);
            const body = JSON.parse(result.body);
            expect(body.success).toBe(false);
            expect(body.message).toBe('Endpoint not found');
        });
    });
});
