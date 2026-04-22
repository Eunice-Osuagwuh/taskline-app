variable "resource_group_name" {
  description = "Azure resource group name"
  type        = string
  default     = "rg-taskline"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "uksouth"
}

variable "aks_cluster_name" {
  description = "AKS cluster name"
  type        = string
  default     = "aks-taskline"
}

variable "db_server_name" {
  description = "PostgreSQL flexible server name (must be globally unique)"
  type        = string
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "tasklinedb"
}

variable "db_admin_user" {
  description = "PostgreSQL admin username"
  type        = string
  sensitive   = true
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "key_vault_name" {
  description = "Key Vault name (must be globally unique, 3-24 chars)"
  type        = string
}

variable "frontend_image" {
  description = "Frontend Docker image with SHA tag"
  type        = string
}

variable "backend_image" {
  description = "Backend Docker image with SHA tag"
  type        = string
}
