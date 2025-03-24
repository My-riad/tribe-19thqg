# Kubernetes module for Tribe platform infrastructure

# Data sources
data "aws_region" "current" {}

data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# Local variables
locals {
  cluster_addons = {
    metrics_server           = var.enable_metrics_server
    cluster_autoscaler       = var.enable_cluster_autoscaler
    load_balancer_controller = var.enable_load_balancer_controller
    prometheus_stack         = var.enable_prometheus_stack
  }
}

# IAM roles and policies for EKS
resource "aws_iam_role" "eks_cluster_role" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "eks.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-cluster-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "eks_service_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

# CloudWatch logs for EKS cluster
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 30

  tags = {
    Name        = "${var.cluster_name}-logs"
    Environment = var.environment
  }
}

# EKS cluster configuration
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = var.kubernetes_version

  enabled_cluster_log_types = var.cluster_log_types

  vpc_config {
    subnet_ids              = var.subnet_ids
    security_group_ids      = [var.security_group_id]
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    public_access_cidrs     = var.public_access_cidrs
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_service_policy,
    aws_cloudwatch_log_group.eks_cluster
  ]

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
  }
}

# OIDC provider for IAM roles for service accounts
resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

# EKS node groups configuration
resource "aws_iam_role" "eks_node_role" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-node-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}

# Node groups
resource "aws_eks_node_group" "node_groups" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-${each.key}"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = var.subnet_ids
  instance_types  = each.value.instance_types
  disk_size       = each.value.disk_size

  scaling_config {
    desired_size = each.value.desired_size
    min_size     = each.value.min_size
    max_size     = each.value.max_size
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    role = each.key
  }

  tags = {
    Name        = "${var.cluster_name}-${each.key}-node"
    Environment = var.environment
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ecr_read_only
  ]
}

# Kubernetes add-ons

# Cluster Autoscaler IAM role
resource "aws_iam_role" "cluster_autoscaler_role" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  name  = "${var.cluster_name}-cluster-autoscaler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      },
      Action = "sts:AssumeRoleWithWebIdentity",
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub": "system:serviceaccount:kube-system:cluster-autoscaler"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-cluster-autoscaler-role"
    Environment = var.environment
  }
}

# Cluster Autoscaler IAM policy
resource "aws_iam_policy" "cluster_autoscaler_policy" {
  count = var.enable_cluster_autoscaler ? 1 : 0
  name  = "${var.cluster_name}-cluster-autoscaler-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeLaunchTemplateVersions"
        ],
        Resource = "*"
      }
    ]
  })
}

# Attach Cluster Autoscaler policy
resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  count      = var.enable_cluster_autoscaler ? 1 : 0
  policy_arn = aws_iam_policy.cluster_autoscaler_policy[0].arn
  role       = aws_iam_role.cluster_autoscaler_role[0].name
}

# Load Balancer Controller IAM role
resource "aws_iam_role" "load_balancer_controller_role" {
  count = var.enable_load_balancer_controller ? 1 : 0
  name  = "${var.cluster_name}-lb-controller-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      },
      Action = "sts:AssumeRoleWithWebIdentity",
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller"
        }
      }
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-lb-controller-role"
    Environment = var.environment
  }
}

# Load Balancer Controller IAM policy
resource "aws_iam_policy" "load_balancer_controller_policy" {
  count = var.enable_load_balancer_controller ? 1 : 0
  name  = "${var.cluster_name}-lb-controller-policy"
  policy = file("${path.module}/policies/load-balancer-controller-policy.json")
}

# Attach Load Balancer Controller policy
resource "aws_iam_role_policy_attachment" "load_balancer_controller" {
  count      = var.enable_load_balancer_controller ? 1 : 0
  policy_arn = aws_iam_policy.load_balancer_controller_policy[0].arn
  role       = aws_iam_role.load_balancer_controller_role[0].name
}

# Monitoring and observability

# Monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  count = var.enable_prometheus_stack ? 1 : 0

  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
    }
  }

  depends_on = [aws_eks_cluster.main]
}

# Metrics Server Helm release
resource "helm_release" "metrics_server" {
  count      = var.enable_metrics_server ? 1 : 0
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  namespace  = "kube-system"
  version    = "3.8.2"

  set {
    name  = "args[0]"
    value = "--kubelet-preferred-address-types=InternalIP"
  }

  depends_on = [aws_eks_node_group.node_groups]
}

# Cluster Autoscaler Helm release
resource "helm_release" "cluster_autoscaler" {
  count      = var.enable_cluster_autoscaler ? 1 : 0
  name       = "cluster-autoscaler"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"
  version    = "9.21.0"

  set {
    name  = "autoDiscovery.clusterName"
    value = var.cluster_name
  }

  set {
    name  = "awsRegion"
    value = data.aws_region.current.name
  }

  set {
    name  = "rbac.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.cluster_autoscaler_role[0].arn
  }

  depends_on = [
    aws_eks_node_group.node_groups,
    aws_iam_role_policy_attachment.cluster_autoscaler
  ]
}

# AWS Load Balancer Controller Helm release
resource "helm_release" "aws_load_balancer_controller" {
  count      = var.enable_load_balancer_controller ? 1 : 0
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = "1.4.6"

  set {
    name  = "clusterName"
    value = var.cluster_name
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.load_balancer_controller_role[0].arn
  }

  set {
    name  = "region"
    value = data.aws_region.current.name
  }

  set {
    name  = "vpcId"
    value = var.vpc_id
  }

  depends_on = [
    aws_eks_node_group.node_groups,
    aws_iam_role_policy_attachment.load_balancer_controller
  ]
}

# Prometheus Stack Helm release
resource "helm_release" "prometheus_stack" {
  count      = var.enable_prometheus_stack ? 1 : 0
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = "monitoring"
  version    = "45.7.1"

  set {
    name  = "prometheus.prometheusSpec.retention"
    value = "${var.prometheus_retention_days}d"
  }

  set {
    name  = "prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes[0]"
    value = "ReadWriteOnce"
  }

  set {
    name  = "prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage"
    value = "50Gi"
  }

  set {
    name  = "grafana.persistence.enabled"
    value = "true"
  }

  set {
    name  = "grafana.persistence.size"
    value = "10Gi"
  }

  depends_on = [
    aws_eks_node_group.node_groups,
    kubernetes_namespace.monitoring
  ]
}

# Provider configurations
provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster_auth.token
}

provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster_auth.token
  }
}