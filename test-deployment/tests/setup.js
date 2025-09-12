"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jest");
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
        send: jest.fn()
    })),
    AdminCreateUserCommand: jest.fn(),
    AdminDeleteUserCommand: jest.fn(),
    AdminGetUserCommand: jest.fn(),
    AdminUpdateUserAttributesCommand: jest.fn(),
    AdminSetUserPasswordCommand: jest.fn(),
    InitiateAuthCommand: jest.fn(),
    RespondToAuthChallengeCommand: jest.fn(),
    ForgotPasswordCommand: jest.fn(),
    ConfirmForgotPasswordCommand: jest.fn(),
    ChangePasswordCommand: jest.fn(),
    GlobalSignOutCommand: jest.fn(),
    ListUsersCommand: jest.fn()
}));
jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({
        send: jest.fn()
    })),
    PutItemCommand: jest.fn(),
    GetItemCommand: jest.fn(),
    UpdateItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn()
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn().mockReturnValue({
            send: jest.fn()
        })
    },
    PutCommand: jest.fn(),
    GetCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn()
}));
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_PROFILE = 'test';
process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.DYNAMODB_USERS_TABLE = 'test-users-table';
process.env.JWT_SECRET = 'test-jwt-secret';
//# sourceMappingURL=setup.js.map