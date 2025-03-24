# Main Terraform configuration for the Tribe platform infrastructure

# This file orchestrates the creation of all AWS resources required for the Tribe platform
# The infrastructure is organized into modules for better maintainability and separation of concerns

# Networking module: Creates VPC, subnets, security groups, and other networking components
# Database module: Provisions PostgreSQL RDS and Redis ElastiCache for the platform
# Kubernetes module: Creates the EKS cluster and node groups for container orchestration
# Additional resources: S3 bucket for media storage, CloudFront distribution, Secrets Manager, etc.

locals {
  app_secrets = {
    openrouter_api_key    = var.openrouter_api_key
    stripe_api_key        = var.stripe_api_key
    venmo_api_key         = var.venmo_api_key
    google_places_api_key = var.google_places_api_key
    firebase_api_key      = var.firebase_api_key
    database_url          = "postgresql://${var.postgres_username}:${var.postgres_password}@${module.database.postgres_endpoint}:${module.database.postgres_port}/${var.postgres_database_name}"
    redis_url             = "redis://${module.database.redis_endpoint}:${module.database.redis_port}"
  }
}

# Networking module creates VPC, subnets, security groups, and other networking components
module "networking" {
  source = "./modules/networking"

  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  private_subnet_cidrs  = var.private_subnet_cidrs
  public_subnet_cidrs   = var.public_subnet_cidrs
}

# Database module provisions PostgreSQL RDS and Redis ElastiCache for the platform
module "database" {
  source = "./modules/database"

  environment                = var.environment
  vpc_id                     = module.networking.vpc_id
  subnet_ids                 = module.networking.private_subnet_ids
  security_group_ids         = module.networking.security_group_ids
  postgres_instance_class    = var.postgres_instance_class
  postgres_allocated_storage = var.postgres_allocated_storage
  postgres_engine_version    = var.postgres_engine_version
  postgres_database_name     = var.postgres_database_name
  postgres_username          = var.postgres_username
  postgres_password          = var.postgres_password
  redis_node_type            = var.redis_node_type
  redis_engine_version       = var.redis_engine_version
  redis_parameter_group_name = var.redis_parameter_group_name
  tags                       = var.tags
}

# Kubernetes module creates the EKS cluster and node groups for container orchestration
module "kubernetes" {
  source = "./modules/kubernetes"

  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.private_subnet_ids
  security_group_id  = lookup(module.networking.security_group_ids, "eks_cluster")
  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  node_groups        = var.node_groups
  tags               = var.tags
}

# Authentication data for EKS cluster
data "aws_eks_cluster_auth" "cluster_auth" {
  name = module.kubernetes.cluster_name
}

# Current AWS region
data "aws_region" "current" {}

# S3 bucket for media storage
resource "aws_s3_bucket" "media_storage" {
  bucket        = "${var.environment}-tribe-media-storage"
  force_destroy = var.environment != "production"
  
  tags = {
    Name        = "${var.environment}-tribe-media-storage"
    Environment = var.environment
  }
}

# Enable versioning for media storage bucket
resource "aws_s3_bucket_versioning" "media_storage_versioning" {
  bucket = aws_s3_bucket.media_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure server-side encryption for media storage bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "media_storage_encryption" {
  bucket = aws_s3_bucket.media_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Configure CORS for media storage bucket
resource "aws_s3_bucket_cors_configuration" "media_storage_cors" {
  bucket = aws_s3_bucket.media_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Configure lifecycle rules for media storage bucket
resource "aws_s3_bucket_lifecycle_configuration" "media_storage_lifecycle" {
  bucket = aws_s3_bucket.media_storage.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }

  rule {
    id     = "noncurrent-version-expiration"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# CloudFront distribution for media storage
resource "aws_cloudfront_distribution" "media_cdn" {
  origin {
    domain_name = aws_s3_bucket.media_storage.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_storage.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media_storage.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.environment}-tribe-media-cdn"
    Environment = var.environment
  }
}

# Secrets Manager for application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.environment}/tribe/app-secrets"
  description             = "Application secrets for the Tribe platform"
  recovery_window_in_days = 7
  
  tags = {
    Name        = "${var.environment}-app-secrets"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id     = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode(local.app_secrets)
}

# Route53 zone for domain (only in production)
resource "aws_route53_zone" "primary" {
  count = var.environment == "production" ? 1 : 0
  
  name = var.domain_name
  
  tags = {
    Name        = "${var.environment}-route53-zone"
    Environment = var.environment
  }
}

# ACM certificate for domain (only in production)
resource "aws_acm_certificate" "cert" {
  count = var.environment == "production" ? 1 : 0
  
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"
  
  tags = {
    Name        = "${var.environment}-acm-cert"
    Environment = var.environment
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# Route53 record for ACM certificate validation (only in production)
resource "aws_route53_record" "cert_validation" {
  count = var.environment == "production" ? 1 : 0
  
  zone_id = aws_route53_zone.primary[0].zone_id
  name    = tolist(aws_acm_certificate.cert[0].domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.cert[0].domain_validation_options)[0].resource_record_type
  records = [tolist(aws_acm_certificate.cert[0].domain_validation_options)[0].resource_record_value]
  ttl     = 60
}

# ACM certificate validation (only in production)
resource "aws_acm_certificate_validation" "cert" {
  count = var.environment == "production" ? 1 : 0
  
  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [aws_route53_record.cert_validation[0].fqdn]
}