# Outputs for the database module
# These outputs expose essential database connection information 
# to other modules and the root configuration

# PostgreSQL outputs
output "postgres_endpoint" {
  description = "Endpoint URL for the PostgreSQL RDS instance"
  value       = aws_db_instance.postgres.address
}

output "postgres_port" {
  description = "Port number for the PostgreSQL RDS instance"
  value       = aws_db_instance.postgres.port
}

output "postgres_replica_endpoint" {
  description = "Endpoint URL for the PostgreSQL read replica (if created)"
  value       = length(aws_db_instance.postgres_replica) > 0 ? aws_db_instance.postgres_replica[0].address : null
}

# Redis outputs
output "redis_endpoint" {
  description = "Endpoint URL for the Redis ElastiCache cluster"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Port number for the Redis ElastiCache cluster"
  value       = aws_elasticache_replication_group.redis.port
}

# Secrets Manager outputs
output "database_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.database_credentials.arn
}