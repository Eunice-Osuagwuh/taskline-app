variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = "rg-taskline"
}

variable "location" {
  description = "The Azure region to deploy the resources to"
  type        = string
  default     = "westeurope"
}

variable "docker_image" {
  description = "Docker image to deploy, e.g. uniquette12/taskline:v1"
  type        = string
}

variable "api_key" {
  description = "The API key to be used by the application"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "The database password"
  type        = string
  sensitive   = true
}