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
export declare const config: EnvironmentConfig;
export default config;
//# sourceMappingURL=environment.d.ts.map