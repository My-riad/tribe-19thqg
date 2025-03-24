# Outputs for the networking module
# These values are exposed for use by other modules or the root module

# VPC outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet outputs
output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = var.availability_zones
}

# Security group outputs
output "security_group_ids" {
  description = "Map of security group names to their IDs"
  value       = local.security_groups
}

# Gateway outputs
output "nat_gateway_ids" {
  description = "List of NAT gateway IDs"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[*].id : []
}

output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = aws_internet_gateway.main.id
}