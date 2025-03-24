# Output variables for the Tribe platform infrastructure

# Networking outputs
output "vpc_id" {
  description = "ID of the VPC where all resources are deployed"
  value       = module.networking.vpc_id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs where application components are deployed"
  value       = module.networking.private_subnet_ids
}

output "public_subnet_ids" {
  description = "List of public subnet IDs where internet-facing resources are deployed"
  value       = module.networking.public_subnet_ids
}

output "security_group_ids" {
  description = "Map of security group IDs for different service types"
  value       = module.networking.security_group_ids
}

# Database outputs
output "database_endpoint" {
  description = "Endpoint URL for the PostgreSQL RDS instance"
  value       = module.database.postgres_endpoint
}

output "database_port" {
  description = "Port number for the PostgreSQL RDS instance"
  value       = module.database.postgres_port
}

output "database_name" {
  description = "Name of the PostgreSQL database"
  value       = var.postgres_database_name
}

output "database_connection_string" {
  description = "Connection string for the PostgreSQL database (without credentials)"
  value       = "postgresql://${module.database.postgres_endpoint}:${module.database.postgres_port}/${var.postgres_database_name}"
}

output "redis_endpoint" {
  description = "Endpoint URL for the Redis ElastiCache cluster"
  value       = module.database.redis_endpoint
}

output "redis_port" {
  description = "Port number for the Redis ElastiCache cluster"
  value       = module.database.redis_port
}

output "redis_connection_string" {
  description = "Connection string for the Redis cluster"
  value       = "redis://${module.database.redis_endpoint}:${module.database.redis_port}"
}

# Kubernetes outputs
output "eks_cluster_endpoint" {
  description = "Endpoint URL for the EKS cluster API server"
  value       = module.kubernetes.cluster_endpoint
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.kubernetes.cluster_name
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.kubernetes.cluster_certificate_authority_data
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OpenID Connect provider for service account IAM roles"
  value       = module.kubernetes.oidc_provider_arn
}

output "kubernetes_config" {
  description = "Configuration map for kubectl to access the EKS cluster"
  value       = {
    host                   = module.kubernetes.cluster_endpoint
    cluster_ca_certificate = base64decode(module.kubernetes.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster_auth.token
  }
  sensitive = true
}

# Storage outputs
output "media_bucket_name" {
  description = "Name of the S3 bucket for media storage"
  value       = aws_s3_bucket.media_storage.bucket
}

output "media_bucket_domain_name" {
  description = "Domain name of the S3 bucket for media storage"
  value       = aws_s3_bucket.media_storage.bucket_regional_domain_name
}

output "media_cdn_domain_name" {
  description = "Domain name of the CloudFront distribution for media content"
  value       = aws_cloudfront_distribution.media_cdn.domain_name
}

output "app_secrets_arn" {
  description = "ARN of the Secrets Manager secret containing application credentials"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

# General outputs
output "domain_name" {
  description = "Domain name for the Tribe platform"
  value       = var.domain_name
}

output "environment" {
  description = "Deployment environment (development, staging, production)"
  value       = var.environment
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.region
}