#requires -Version 5.0
<#
  RoutingNMS backend module rename
  ---------------------------------
  Renames the 8 top-level Maven module folders that still carry the
  OpenNMS name, and rewrites every text reference to them (pom.xml
  <module>/<artifactId>/<dependency> entries, build scripts, Debian
  packaging, container/deploy configs, docs) so the Maven reactor still
  resolves after the rename.

  Does NOT touch the org.opennms.* Java package (that's ~11,000 files
  and a separate, much bigger job — skip unless you explicitly asked
  for it).

  Run this from the repo root: F:\Web project\R-NMS
    powershell -ExecutionPolicy Bypass -File rename-backend-modules.ps1
#>

$ErrorActionPreference = "Stop"
$repoRoot = Get-Location

$pairs = [ordered]@{
  "opennms-ackd"          = "routingnms-ackd"
  "opennms-alarms"        = "routingnms-alarms"
  "opennms-assemblies"    = "routingnms-assemblies"
  "opennms-base-assembly" = "routingnms-base-assembly"
  "opennms-bootstrap"     = "routingnms-bootstrap"
  "opennms-config-api"    = "routingnms-config-api"
  "opennms-config-dao"    = "routingnms-config-dao"
  "opennms-config-jaxb"   = "routingnms-config-jaxb"
}

Write-Host "== Step 1/3: rewriting text references ==" -ForegroundColor Cyan

# Only walk files that could plausibly reference a module name — skip
# heavy/binary/vendor trees entirely so this finishes in minutes, not hours.
$excludeDirs = @(".git", "node_modules", ".next", "target", "dist", "build", ".m2", "logs")
$binaryExt = @(".png", ".jpg", ".jpeg", ".gif", ".ico", ".jar", ".class", ".zip", ".tar", ".gz",
               ".mib", ".keystore", ".jrxml", ".woff", ".woff2", ".ttf", ".eot", ".pdf")

$pattern = ($pairs.Keys | ForEach-Object { [regex]::Escape($_) }) -join "|"
$regex = [regex]$pattern

Write-Host "Scanning for files that mention any of the 8 module names..."
$candidates = Get-ChildItem -Path $repoRoot -Recurse -File -Force |
  Where-Object {
    $full = $_.FullName
    -not ($excludeDirs | Where-Object { $full -match [regex]::Escape("\$_\") }) -and
    ($binaryExt -notcontains $_.Extension.ToLower())
  } |
  Select-String -Pattern $pattern -List -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty Path -Unique

Write-Host "Found $($candidates.Count) files referencing the old names. Rewriting..."

$changed = 0
foreach ($path in $candidates) {
  try {
    $text = [System.IO.File]::ReadAllText($path)
  } catch {
    Write-Warning "Skipped (unreadable as text): $path"
    continue
  }
  $newText = $regex.Replace($text, { param($m) $pairs[$m.Value] })
  if ($newText -ne $text) {
    [System.IO.File]::WriteAllText($path, $newText)
    $changed++
  }
}
Write-Host "Rewrote $changed files." -ForegroundColor Green

Write-Host "== Step 2/3: renaming the module directories (git mv) ==" -ForegroundColor Cyan
foreach ($old in $pairs.Keys) {
  $new = $pairs[$old]
  if (Test-Path $old) {
    git mv $old $new
    Write-Host "  $old -> $new" -ForegroundColor Green
  } else {
    Write-Warning "  $old not found (already renamed?) — skipping"
  }
}

Write-Host "== Step 3/3: summary ==" -ForegroundColor Cyan
Write-Host "Review the changes before committing:"
Write-Host "  git status"
Write-Host "  git diff --stat"
Write-Host ""
Write-Host "Then validate the Maven reactor still resolves (fast, doesn't compile):"
Write-Host "  mvn -q -N validate"
Write-Host ""
Write-Host "If that's clean, commit:"
Write-Host '  git add -A'
Write-Host '  git commit -m "Rename backend Maven modules to routingnms-*"'
Write-Host '  git push'
