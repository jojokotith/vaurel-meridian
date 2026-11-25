# Downloads the Unsplash photos used by the site into .\photos and writes index-offline.html that uses them.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
New-Item -ItemType Directory -Force -Path photos | Out-Null
$html = Get-Content -Raw -Encoding UTF8 index.html
$ids = @(
  "1566342088293-38debd381c63",
  "1610970182773-ea35a6ed6586",
  "1779442563698-11fad08a733e",
  "1636095643796-28270e862979",
  "1793484897536-87a6852238eb",
  "1511081692775-05d0f180a065",
  "1728761390316-935ffeb3fbcc",
  "1497636577773-f1231844b336",
  "1763207291707-e2cf471ed72b",
  "1766350731223-79313d2e68e5",
  "1761027101486-d0403a229f88",
  "1776548736734-0654a4d8b7ec",
  "1511920170033-f8396924c348",
  "1743803983331-5547515bba98",
  "1532713107108-dfb5d8d2fc42",
  "1521017432531-fbd92d768814",
  "1542372147193-a7aca54189cd",
  "1504754524776-8f4f37790ca0",
  "1775167131023-87e78597c4ca",
  "1541167760496-1628856ab772",
  "1528699633788-424224dc89b5",
  "1669135316766-5c2a2a4f2e02"
)
foreach ($id in $ids) {
  $out = "photos\$id.jpg"
  if (-not (Test-Path $out)) {
    Invoke-WebRequest -Uri "https://images.unsplash.com/photo-$($id)?auto=format&fm=jpg&fit=crop&w=1800&q=80" -OutFile $out
    Write-Host "OK  $id"
  }
  $pattern = "https://images\.unsplash\.com/photo-" + [regex]::Escape($id) + "\?[^ `"]*"
  $html = [regex]::Replace($html, $pattern, "photos/$id.jpg")
}
[IO.File]::WriteAllText((Join-Path $PSScriptRoot "index-offline.html"), $html, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Done: photos\ and index-offline.html"
