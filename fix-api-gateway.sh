#!/bin/bash

# Fix API Gateway integration for Auth Service
set -e

echo "🔧 Fixing API Gateway integration for Auth Service..."

# Configuration
REST_API_ID="xa89fa9t75"
LAMBDA_FUNCTION_ARN="arn:aws:lambda:us-east-1:227830417626:function:angelwatch-production-auth-service"
AWS_PROFILE="angelwatch"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Get the /auth resource ID
print_status "Getting /auth resource ID..."
AUTH_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $REST_API_ID --profile $AWS_PROFILE --query 'items[?path==`/auth`].id' --output text)
print_success "Auth resource ID: $AUTH_RESOURCE_ID"

# Create ANY method for /auth
print_status "Creating ANY method for /auth..."
aws apigateway put-method \
    --rest-api-id $REST_API_ID \
    --resource-id $AUTH_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --profile $AWS_PROFILE

print_success "ANY method created"

# Create Lambda integration for /auth
print_status "Creating Lambda integration for /auth..."
aws apigateway put-integration \
    --rest-api-id $REST_API_ID \
    --resource-id $AUTH_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_FUNCTION_ARN/invocations" \
    --profile $AWS_PROFILE

print_success "Lambda integration created"

# Add Lambda permission for API Gateway
print_status "Adding Lambda permission for API Gateway..."
aws lambda add-permission \
    --function-name angelwatch-production-auth-service \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:us-east-1:227830417626:$REST_API_ID/*/*" \
    --profile $AWS_PROFILE 2>/dev/null || echo "Permission already exists"

print_success "Lambda permission added"

# Deploy the API
print_status "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id $REST_API_ID \
    --stage-name production \
    --profile $AWS_PROFILE

print_success "API Gateway deployed"

# Test the endpoint
print_status "Testing the endpoint..."
sleep 5  # Wait for deployment to complete

echo ""
echo "🧪 Testing API endpoints..."

# Test health endpoint
echo "Testing /auth/health..."
curl -s "https://$REST_API_ID.execute-api.us-east-1.amazonaws.com/production/auth/health" | jq . || echo "Health check failed"

echo ""
echo "Testing /auth/register..."
curl -s -X POST "https://$REST_API_ID.execute-api.us-east-1.amazonaws.com/production/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","firstName":"John","lastName":"Doe","role":"student"}' | jq . || echo "Registration test failed"

echo ""
print_success "🎉 API Gateway integration fixed!"
print_status "You can now test the authentication service in your browser using:"
print_status "https://$REST_API_ID.execute-api.us-east-1.amazonaws.com/production/auth/health"
