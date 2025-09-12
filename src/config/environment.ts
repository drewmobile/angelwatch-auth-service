// Environment configuration for AngelWatch Auth Service
export interface EnvironmentConfig {
    nodeEnv: string;
    awsRegion: string;
    awsProfile: string;
    apiGatewayUrl: string;
    cognitoUserPoolId: string;
    cognitoClientId: string;
    cognitoDomain: string;
    dynamodbUsersTable: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    googleClientId?: string;
    googleClientSecret?: string;
    serviceName: string;
    serviceVersion: string;
    logLevel: string;
}

export const config: EnvironmentConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsProfile: process.env.AWS_PROFILE || 'angelwatch',
    apiGatewayUrl: process.env.API_GATEWAY_URL || 'https://xa89fa9t75.execute-api.us-east-1.amazonaws.com/production',
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_w7AMQFiuT',
    cognitoClientId: process.env.COGNITO_CLIENT_ID || '7q7kcp0is36enfqebn43j04ocj',
    cognitoDomain: process.env.COGNITO_DOMAIN || 'angelwatch-production-auth.auth.us-east-1.amazoncognito.com',
    dynamodbUsersTable: process.env.DYNAMODB_USERS_TABLE || 'angelwatch-production-users',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    serviceName: process.env.SERVICE_NAME || 'angelwatch-auth-service',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    logLevel: process.env.LOG_LEVEL || 'debug'
};

export default config;
