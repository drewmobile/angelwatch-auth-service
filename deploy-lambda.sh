#!/bin/bash

# AngelWatch Auth Service Lambda Deployment Script
set -e

echo "🚀 Deploying AngelWatch Auth Service to Lambda..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity --profile angelwatch &> /dev/null; then
    print_error "AWS credentials not configured for profile 'angelwatch'"
    exit 1
fi

print_success "AWS credentials verified"

# Build the service
print_status "Building the Auth Service..."
npm run build
print_success "Build completed"

# Create deployment package
print_status "Creating deployment package..."
mkdir -p deployment
cp -r dist/* deployment/
cp package*.json deployment/

# Install production dependencies
print_status "Installing production dependencies..."
cd deployment
npm install --production --silent
cd ..

# Create ZIP package
print_status "Creating ZIP package..."
cd deployment
zip -r ../lambda-deployment.zip . -q
cd ..

# Deploy to Lambda
print_status "Deploying to Lambda..."
aws lambda update-function-code \
    --function-name angelwatch-production-auth-service \
    --zip-file fileb://lambda-deployment.zip \
    --profile angelwatch

print_success "Lambda function updated!"

# Test the deployment
print_status "Testing Lambda function..."
aws lambda invoke \
    --function-name angelwatch-production-auth-service \
    --profile angelwatch \
    --payload '{"httpMethod":"OPTIONS","path":"/auth/test","headers":{},"body":null,"isBase64Encoded":false,"pathParameters":null,"queryStringParameters":null,"multiValueQueryStringParameters":null,"multiValueHeaders":{},"requestContext":{},"resource":"","stageVariables":null}' \
    --cli-binary-format raw-in-base64-out \
    response.json

if [ $? -eq 0 ]; then
    print_success "Lambda function test successful!"
    echo "Response:"
    cat response.json | jq .
    rm response.json
else
    print_warning "Lambda function test failed"
    cat response.json
    rm response.json
fi

# Cleanup
print_status "Cleaning up..."
rm -rf deployment
rm lambda-deployment.zip

echo ""
print_success "🎉 AngelWatch Auth Service deployed successfully!"
print_status "Lambda Function: angelwatch-production-auth-service"
print_status "Next steps:"
echo "1. Update API Gateway to use the Lambda function"
echo "2. Test authentication endpoints"
echo "3. Configure frontend to use the new API"
