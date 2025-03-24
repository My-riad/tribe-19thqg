# Database module for the Tribe platform
# This module provisions and configures PostgreSQL RDS instances and Redis ElastiCache clusters

# Use the random provider to generate passwords if not provided
resource "random_password" "postgres_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  count            = var.postgres_password == null ? 1 : 0
}

locals {
  # Database credentials to be stored in Secrets Manager
  db_credentials = {
    postgres_username = var.postgres_username
    postgres_password = var.postgres_password != null ? var.postgres_password : random_password.postgres_password[0].result
    postgres_endpoint = aws_db_instance.postgres.address
    postgres_port     = aws_db_instance.postgres.port
    postgres_database = var.postgres_database_name
    redis_endpoint    = aws_elasticache_replication_group.redis.primary_endpoint_address
    redis_port        = aws_elasticache_replication_group.redis.port
  }
}

# Get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# PostgreSQL resources
resource "aws_db_subnet_group" "postgres" {
  name       = "${var.environment}-postgres-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.environment}-postgres-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${var.environment}-postgres-parameter-group"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name        = "${var.environment}-postgres-parameter-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.environment}-tribe-postgres"
  engine            = "postgres"
  engine_version    = var.postgres_engine_version
  instance_class    = var.postgres_instance_class
  allocated_storage = var.postgres_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.postgres_database_name
  username = var.postgres_username
  password = var.postgres_password != null ? var.postgres_password : random_password.postgres_password[0].result
  port     = 5432

  multi_az               = lookup(var.multi_az, var.environment, false)
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [lookup(var.security_group_ids, "database", "")]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  backup_retention_period = lookup(var.backup_retention_period, var.environment, 7)
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"
  
  auto_minor_version_upgrade = true
  deletion_protection        = lookup(var.deletion_protection, var.environment, false)
  skip_final_snapshot        = lookup(var.skip_final_snapshot, var.environment, true)
  final_snapshot_identifier  = "${var.environment}-tribe-postgres-final-snapshot"

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                   = aws_iam_role.rds_monitoring_role.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.environment}-tribe-postgres"
    Environment = var.environment
  }
}

# Create read replica in production environment
resource "aws_db_instance" "postgres_replica" {
  count = var.environment == "production" ? 1 : 0

  identifier          = "${var.environment}-tribe-postgres-replica"
  replicate_source_db = aws_db_instance.postgres.identifier
  instance_class      = var.postgres_instance_class
  storage_encrypted   = true
  port                = 5432

  vpc_security_group_ids = [lookup(var.security_group_ids, "database", "")]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  backup_retention_period = lookup(var.backup_retention_period, var.environment, 7)
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"
  
  auto_minor_version_upgrade = true

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                   = aws_iam_role.rds_monitoring_role.arn

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.environment}-tribe-postgres-replica"
    Environment = var.environment
  }
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring_role" {
  name = "${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_attachment" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Redis resources
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.environment}-redis-subnet-group"
    Environment = var.environment
  }
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.environment}-redis-parameter-group"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = {
    Name        = "${var.environment}-redis-parameter-group"
    Environment = var.environment
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.environment}-tribe-redis"
  description          = "Redis cluster for the Tribe platform"
  
  node_type               = var.redis_node_type
  port                    = 6379
  parameter_group_name    = aws_elasticache_parameter_group.redis.name
  subnet_group_name       = aws_elasticache_subnet_group.redis.name
  security_group_ids      = [lookup(var.security_group_ids, "redis", "")]

  automatic_failover_enabled = lookup(var.redis_automatic_failover_enabled, var.environment, false)
  multi_az_enabled           = lookup(var.redis_multi_az_enabled, var.environment, false)
  num_cache_clusters         = lookup(var.redis_num_cache_clusters, var.environment, 1)

  engine_version            = var.redis_engine_version
  snapshot_retention_limit  = lookup(var.redis_snapshot_retention_limit, var.environment, 1)
  snapshot_window           = "03:00-04:00"
  maintenance_window        = "sun:04:30-sun:05:30"
  
  at_rest_encryption_enabled  = var.at_rest_encryption_enabled
  transit_encryption_enabled  = var.transit_encryption_enabled
  auto_minor_version_upgrade  = true

  tags = {
    Name        = "${var.environment}-tribe-redis"
    Environment = var.environment
  }
}

# Secrets Manager resources
resource "aws_secretsmanager_secret" "database_credentials" {
  name        = "${var.environment}/tribe/database-credentials"
  description = "Database credentials for the Tribe platform"
  
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.environment}-database-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id     = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode(local.db_credentials)
}

# Outputs
output "postgres_endpoint" {
  description = "PostgreSQL RDS endpoint"
  value       = aws_db_instance.postgres.address
}

output "postgres_port" {
  description = "PostgreSQL RDS port"
  value       = aws_db_instance.postgres.port
}

output "redis_endpoint" {
  description = "Redis ElastiCache endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis ElastiCache port"
  value       = aws_elasticache_replication_group.redis.port
}