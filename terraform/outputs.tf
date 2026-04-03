output "app_url" {
  description = "Public URL of the deployed taskline app"
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
}