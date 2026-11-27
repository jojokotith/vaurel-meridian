# Завантажує фото сайту в .\photos і створює index-offline.html, який бере їх із цієї папки.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
New-Item -ItemType Directory -Force -Path photos | Out-Null
$html = Get-Content -Raw -Encoding UTF8 index.html
$ids = @(
  "1613158556069-e7d8eae76214",
  "1710242835722-49f4e8a05fb6",
  "1638338823311-1f0020940629",
  "1763343030530-d76455f7526f",
  "1792314186676-f828e46ba35c",
  "1712945083920-6264400faaaa",
  "1620490448382-d2f51a08596f",
  "1616714109948-c74fe5029a4d",
  "1759259639356-7c6e74eed1ec",
  "1764281469526-e1c378515e6f",
  "1786213165660-69105dbdbb47",
  "1762411238451-b90dd1c74238"
)
foreach ($id in $ids) {
  $out = "photos\$id.jpg"
  if (-not (Test-Path $out)) { Invoke-WebRequest -Uri "https://images.unsplash.com/photo-$($id)?auto=format&fm=jpg&w=1800&q=80" -OutFile $out; Write-Host "OK  $id" }
  $pattern = "https://images\.unsplash\.com/photo-" + [regex]::Escape($id) + "\?[^ `"]*"
  $html = [regex]::Replace($html, $pattern, "photos/$id.jpg")
}
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "index-offline.html"), $html, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Готово: photos\ і index-offline.html"
