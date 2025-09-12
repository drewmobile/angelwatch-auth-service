#!/bin/bash

# Create API Gateway endpoints for Auth Service
set -e

echo "🚀 Creating API Gateway endpoints for Auth Service..."

# Configuration
API_GATEWAY_ID="xa89fa9t75"
AUTH_RESOURCE_ID="074t6k"
LAMBDA_FUNCTION_ARN="arn:aws:lambda:us-east-1:227830417626:function:angelwatch-production-auth-service"
REGION="us-east-1"

# Function to create endpoint
create_endpoint() {
    local method=$1
    local path_part=$2
    
    echo "Creating $method /auth/$path_part endpoint..."
    
    # Get or create resource
    local resource_id=$(aws apigateway get-resources \
        --rest-api-id $API_GATEWAY_ID \
        --profile angelwatch \
        --query "items[?pathPart=='$path_part' && parentId=='$AUTH_RESOURCE_ID'].id" \
        --output text)
    
    if [ -z "$resource_id" ] || [ "$resource_id" = "None" ]; then
        resource_id=$(aws apigateway create-resource \
            --rest-api-id $API_GATEWAY_ID \
            --parent-id $AUTH_RESOURCE_ID \
            --path-part $path_part \
            --profile angelwatch \
            --query 'id' \
            --output text)
    fi
    
    # Create method
    aws apigateway put-method \
        --rest-api-id $API_GATEWAY_ID \
        --resource-id $resource_id \
        --http-method $method \
        --authorization-type NONE \
        --profile angelwatch > /dev/null
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id $API_GATEWAY_ID \
        --resource-id $resource_id \
        --http-method $method \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_FUNCTION_ARN/invocations" \
        --profile angelwatch > /dev/null
    
    echo "✅ Created $method /auth/$path_part"
}

# Create endpoints
create_endpoint "POST" "register"
create_endpoint "POST" "login"
create_endpoint "GET" "profile"
create_endpoint "PUT" "profile"
create_endpoint "POST" "change-password"
create_endpoint "POST" "forgot-password"
create_endpoint "POST" "confirm-password-reset"
create_endpoint "POST" "refresh-token"
create_endpoint "POST" "signout"
create_endpoint "DELETE" "account"

# Deploy API Gateway
echo "Deploying API Gateway..."
aws apigateway create-deployment \
    --rest-api-id $API_GATEWAY_ID \
    --stage-name production \
    --profile angelwatch > /dev/null

echo "✅ API Gateway deployed!"

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."

API_URL="https://xa89fa9t75.execute-api.us-east-1.amazonaws.com/production"

# Test registration
echo "Testing registration..."
curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe","role":"student"}' \
    | jq .

echo ""
echo "🎉 API Gateway integration complete!"
echo "API URL: $API_URL"
