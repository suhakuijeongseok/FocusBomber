$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
$releaseDirectory = Join-Path $projectRoot "releases"
$stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("focus-bomber-" + [guid]::NewGuid())
$archivePath = Join-Path $releaseDirectory ("focus-bomber-extension-store-v" + $manifest.version + ".zip")

$runtimeFiles = @(
  "manifest.json",
  "background.js",
  "content.js",
  "content.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "offscreen.html",
  "offscreen.js",
  "sound_effect"
)

New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $releaseDirectory | Out-Null

try {
  foreach ($relativePath in $runtimeFiles) {
    Copy-Item -Recurse -LiteralPath (Join-Path $projectRoot $relativePath) -Destination $stagingDirectory
  }
  $stagingAssets = Join-Path $stagingDirectory "assets"
  $stagingIcons = Join-Path $stagingAssets "icons"
  New-Item -ItemType Directory -Force -Path $stagingIcons | Out-Null
  Copy-Item -LiteralPath (Join-Path $projectRoot "assets\aircraft-fighter.png") -Destination $stagingAssets
  foreach ($iconSize in @(16, 32, 48, 128)) {
    Copy-Item -LiteralPath (Join-Path $projectRoot "assets\icons\icon-$iconSize.png") -Destination $stagingIcons
  }
  if (Test-Path -LiteralPath $archivePath) {
    throw "Release archive already exists: $archivePath"
  }
  Compress-Archive -Path (Join-Path $stagingDirectory "*") -DestinationPath $archivePath -CompressionLevel Optimal
  Write-Output $archivePath
} finally {
  if (Test-Path -LiteralPath $stagingDirectory) {
    Remove-Item -Recurse -Force -LiteralPath $stagingDirectory
  }
}
