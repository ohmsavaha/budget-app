# 나의 가계부 — 로컬 미리보기용 정적 서버 (개발 도구, 배포와 무관)
$port = 8321
$root = Split-Path -Parent $PSScriptRoot  # 프로젝트 루트 (budget-app)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "Serving $root on http://localhost:$port/"
$mime = @{
  ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8";
  ".json"="application/json; charset=utf-8"; ".webmanifest"="application/manifest+json";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".css"="text/css; charset=utf-8";
  ".svg"="image/svg+xml"; ".ico"="image/x-icon"; ".ts"="text/plain"
}
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path.TrimStart("/") -replace "/", "\")
    # 루트 밖 접근 차단
    $full = [System.IO.Path]::GetFullPath($file)
    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }
    if (Test-Path $full -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] } else { $ctx.Response.ContentType = "application/octet-stream" }
      $ctx.Response.Headers.Add("Cache-Control","no-store")
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch { }
}
