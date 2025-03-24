# Output variables for the Kubernetes module

# EKS cluster outputs
output "cluster_endpoint" {
  description = "Endpoint URL for the EKS cluster API server"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster control plane"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS worker nodes"
  value       = aws_eks_cluster.main.vpc_config[0].security_group_ids[0]
}

output "kubernetes_version" {
  description = "Kubernetes version running in the EKS cluster"
  value       = aws_eks_cluster.main.version
}

output "oidc_provider_arn" {
  description = "ARN of the OpenID Connect provider for service account IAM roles"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "node_groups" {
  description = "Map of EKS node groups created in the cluster"
  value       = aws_eks_node_group.node_groups
}

# IAM role outputs
output "cluster_iam_role_name" {
  description = "IAM role name associated with the EKS cluster"
  value       = aws_iam_role.eks_cluster_role.name
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with the EKS cluster"
  value       = aws_iam_role.eks_cluster_role.arn
}

output "node_iam_role_name" {
  description = "IAM role name associated with the EKS worker nodes"
  value       = aws_iam_role.eks_node_role.name
}

output "node_iam_role_arn" {
  description = "IAM role ARN associated with the EKS worker nodes"
  value       = aws_iam_role.eks_node_role.arn
}

# Add-on outputs
output "cluster_autoscaler_iam_role_arn" {
  description = "IAM role ARN for the Kubernetes Cluster Autoscaler"
  value       = var.enable_cluster_autoscaler ? aws_iam_role.cluster_autoscaler_role[0].arn : null
}

output "load_balancer_controller_iam_role_arn" {
  description = "IAM role ARN for the AWS Load Balancer Controller"
  value       = var.enable_load_balancer_controller ? aws_iam_role.load_balancer_controller_role[0].arn : null
}

output "cluster_addons" {
  description = "Map of enabled Kubernetes add-ons in the cluster"
  value       = local.cluster_addons
}