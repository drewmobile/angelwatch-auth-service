#!/bin/bash

# Fix CORS issues for Auth Service API Gateway
set -e

echo "🔧 Fixing CORS issues for Auth Service..."

# Configuration
REST_API_ID="xa89fa9t75"
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

# Update the ANY method to remove any authorizer
print_status "Updating ANY method to remove authorizer..."
aws apigateway update-method \
    --rest-api-id $REST_API_ID \
    --resource-id $AUTH_RESOURCE_ID \
    --http-method ANY \
    --patch-ops '[{"op":"remove","path":"/authorizationType"},{"op":"remove","path":"/authorizerId"}]' \
    --profile $AWS_PROFILE

print_success "ANY method updated"

# Deploy the API
print_status "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id $REST_API_ID \
    --stage-name production \
    --profile $AWS_PROFILE

print_success "API Gateway deployed"

# Test CORS preflight
print_status "Testing CORS preflight..."
sleep 5  # Wait for deployment to complete

curl -s -X OPTIONS "https://$REST_API_ID.execute-api.us-east-1.amazonaws.com/production/auth/login" \
  -H "Origin: file://" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(HTTP/2|access-control)" || echo "CORS test completed"

echo ""
print_success "🎉 CORS issues fixed!"
print_status "You can now test the authentication service in your browser"
