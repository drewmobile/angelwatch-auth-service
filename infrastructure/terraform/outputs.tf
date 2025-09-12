# Outputs for AngelWatch Auth Service Lambda

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.auth_service.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.auth_service.arn
}

output "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.auth_service.invoke_arn
}

# Function URL would need to be created separately if needed
