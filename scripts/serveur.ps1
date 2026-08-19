# =============================================================================
#  PNDA - Matching Grant
#  Serveur web local minimal, sans aucune dependance.
#  Utilise HttpListener, present dans toute installation Windows.
#  Appele automatiquement par 3-servir-formulaire.cmd si Python est absent.
# =============================================================================
param(
  [int]$Port = 5173,
  [string]$Racine = (Join-Path (Split-Path -Parent $PSScriptRoot) 'web')
)

$ErrorActionPreference = 'Stop'
$Racine = (Resolve-Path $Racine).Path

$Types = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'
  '.js'  ='application/javascript; charset=utf-8'
  '.css' ='text/css; charset=utf-8'
  '.json'='application/json; charset=utf-8'
  '.svg' ='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'
  '.webp'='image/webp'; '.ico'='image/x-icon'; '.pdf'='application/pdf'
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.map'='application/json'
}

$ecouteur = New-Object System.Net.HttpListener
$ecouteur.Prefixes.Add("http://localhost:$Port/")

try { $ecouteur.Start() }
catch {
  Write-Host ""
  Write-Host "  Impossible d'ouvrir le port $Port." -ForegroundColor Red
  Write-Host "  Un autre programme l'utilise deja, ou l'acces est refuse."
  Write-Host "  Relancez avec un autre port :  powershell -File serveur.ps1 -Port 5174"
  Write-Host ""
  exit 1
}

Write-Host ""
Write-Host "  ============================================================"
Write-Host "   PNDA - Matching Grant : formulaire d'enregistrement"
Write-Host "  ============================================================"
Write-Host "   Dossier servi : $Racine"
Write-Host "   Adresse       : http://localhost:$Port" -ForegroundColor Green
Write-Host "   Arret         : Ctrl+C"
Write-Host "  ============================================================"
Write-Host ""

Start-Process "http://localhost:$Port/"

while ($ecouteur.IsListening) {
  try {
    $ctx = $ecouteur.GetContext()
    $req = $ctx.Request
    $rep = $ctx.Response

    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
    $rel = $rel -replace '/', '\'

    $chemin = Join-Path $Racine $rel

    # Empeche toute sortie du dossier web\ (traversee de repertoire)
    $complet = $null
    try { $complet = [System.IO.Path]::GetFullPath($chemin) } catch { }

    if (-not $complet -or -not $complet.StartsWith($Racine, [StringComparison]::OrdinalIgnoreCase)) {
      $rep.StatusCode = 403
      $corps = [Text.Encoding]::UTF8.GetBytes('403 - Acces refuse')
    }
    elseif (Test-Path -LiteralPath $complet -PathType Leaf) {
      $rep.StatusCode = 200
      $ext = [System.IO.Path]::GetExtension($complet).ToLower()
      $rep.ContentType = if ($Types.ContainsKey($ext)) { $Types[$ext] } else { 'application/octet-stream' }
      $rep.Headers.Add('Cache-Control', 'no-store')
      $corps = [System.IO.File]::ReadAllBytes($complet)
    }
    else {
      $rep.StatusCode = 404
      $rep.ContentType = 'text/plain; charset=utf-8'
      $corps = [Text.Encoding]::UTF8.GetBytes("404 - Fichier introuvable : $rel")
    }

    Write-Host ("  {0}  {1}" -f $rep.StatusCode, $req.Url.AbsolutePath)
    $rep.ContentLength64 = $corps.Length
    $rep.OutputStream.Write($corps, 0, $corps.Length)
    $rep.OutputStream.Close()
  }
  catch {
    Write-Host ("  Erreur : {0}" -f $_.Exception.Message) -ForegroundColor Yellow
  }
}

$ecouteur.Stop()
