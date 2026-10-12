param([string]$StorePath = (Join-Path $PSScriptRoot '..\..\FihanStore'))
$ErrorActionPreference = 'Stop'
$storeRoot = (Resolve-Path -LiteralPath $StorePath).Path
$mobileRoot = Split-Path $PSScriptRoot -Parent
$files = @('src\lib\api.ts', 'src\app\api\auth\route.ts')
foreach ($relative in $files) {
  $current = Join-Path $storeRoot $relative
  $original = Join-Path $mobileRoot ('backend\original\' + $relative)
  if (!(Test-Path -LiteralPath $current)) { throw "Missing backend file: $relative" }
  if ((Get-FileHash -LiteralPath $current).Hash -ne (Get-FileHash -LiteralPath $original).Hash) {
    throw "Backend file changed since this update was prepared: $relative. Review before applying."
  }
}
foreach ($relative in $files) {
  Copy-Item -LiteralPath (Join-Path $mobileRoot ('backend\' + $relative)) -Destination (Join-Path $storeRoot $relative)
}
Write-Output 'Applied mobile token authentication to the existing API. Deploy the web project after checks pass.'
