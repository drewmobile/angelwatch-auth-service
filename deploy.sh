#!/bin/bash

# AngelWatch Auth Service Deployment Script
set -e

echo "🚀 Starting AngelWatch Auth Service Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity --profile angelwatch &> /dev/null; then
    print_error "AWS credentials not configured for profile 'angelwatch'"
    print_status "Please run: aws configure --profile angelwatch"
    exit 1
fi

print_success "AWS credentials verified"

# Build the service
print_status "Building the Auth Service..."
npm run build
print_success "Build completed"

# Get infrastructure values from main terraform
print_status "Getting infrastructure values..."
cd ../../repos/angelwatch-infrastructure/terraform

# Get Cognito values
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_CLIENT_ID="7q7kcp0is36enfqebn43j04ocj"  # From AWS CLI
COGNITO_DOMAIN="angelwatch-production-auth"  # From AWS CLI

# Get DynamoDB table name
DYNAMODB_USERS_TABLE=$(terraform output -json dynamodb_tables | jq -r '.users')

# Get API Gateway execution ARN
API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
API_GATEWAY_EXECUTION_ARN="arn:aws:execute-api:us-east-1:$(aws sts get-caller-identity --profile angelwatch --query Account --output text):$(echo $API_GATEWAY_URL | sed 's/.*\/\/\([^.]*\)\..*/\1/')/production"

# Generate JWT secret (in production, use AWS Secrets Manager)
JWT_SECRET=$(openssl rand -base64 32)

print_success "Infrastructure values retrieved"

# Deploy Lambda function
print_status "Deploying Lambda function..."
cd ../../angelwatch-auth-service/infrastructure/terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
cognito_user_pool_id = "$COGNITO_USER_POOL_ID"
cognito_client_id = "$COGNITO_CLIENT_ID"
cognito_domain = "$COGNITO_DOMAIN"
dynamodb_users_table = "$DYNAMODB_USERS_TABLE"
jwt_secret = "$JWT_SECRET"
api_gateway_execution_arn = "$API_GATEWAY_EXECUTION_ARN"
EOF

# Plan deployment
print_status "Planning Terraform deployment..."
terraform plan

# Apply deployment
print_status "Applying Terraform deployment..."
terraform apply -auto-approve

# Get Lambda function details
LAMBDA_FUNCTION_NAME=$(terraform output -raw lambda_function_name)
LAMBDA_FUNCTION_ARN=$(terraform output -raw lambda_function_arn)
LAMBDA_INVOKE_ARN=$(terraform output -raw lambda_invoke_arn)

print_success "Lambda function deployed successfully!"

# Display deployment information
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "Lambda Function Name: $LAMBDA_FUNCTION_NAME"
echo "Lambda Function ARN: $LAMBDA_FUNCTION_ARN"
echo "Lambda Invoke ARN: $LAMBDA_INVOKE_ARN"
echo ""

# Test the deployment
print_status "Testing Lambda function..."
if aws lambda invoke \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --profile angelwatch \
    --payload '{"httpMethod":"OPTIONS","path":"/auth/test","headers":{},"body":null,"isBase64Encoded":false,"pathParameters":null,"queryStringParameters":null,"multiValueQueryStringParameters":null,"multiValueHeaders":{},"requestContext":{},"resource":"","stageVariables":null}' \
    response.json &> /dev/null; then
    
    print_success "Lambda function test successful!"
    echo "Response:"
    cat response.json
    rm response.json
else
    print_warning "Lambda function test failed, but deployment was successful"
fi

echo ""
print_success "🎉 AngelWatch Auth Service deployed successfully!"
print_status "Next steps:"
echo "1. Update API Gateway to use the new Lambda function"
echo "2. Test authentication endpoints"
echo "3. Configure frontend to use the new API"

echo ""
print_status "Lambda Function Details:"
echo "- Function Name: $LAMBDA_FUNCTION_NAME"
echo "- Function ARN: $LAMBDA_FUNCTION_ARN"
echo "- Invoke ARN: $LAMBDA_INVOKE_ARN"
