param(
  [Parameter(Mandatory=$true)][string]$SourceImage
)

# Extract geometry, not a new image. The portfolio only ships this small point list.
# Source: Findus_hub/public/brand/findus-smile-black.png, used by FindusAvatar.
Add-Type -AssemblyName System.Drawing
$sourceBitmap = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $SourceImage).Path)
$sampleBitmap = [System.Drawing.Bitmap]::new(256, 256)
$graphics = [System.Drawing.Graphics]::FromImage($sampleBitmap)
try {
  $graphics.DrawImage($sourceBitmap, 0, 0, 256, 256)
  $mask = [byte[]]::new(256 * 256)
  for ($y = 0; $y -lt 256; $y++) {
    for ($x = 0; $x -lt 256; $x++) {
      $pixel = $sampleBitmap.GetPixel($x, $y)
      if ($pixel.A -gt 120 -and $pixel.R -lt 125) { $mask[$y * 256 + $x] = 1 }
    }
  }
  $points = [System.Collections.Generic.List[object]]::new()
  for ($y = 1; $y -lt 255; $y++) {
    for ($x = 1; $x -lt 255; $x++) {
      $index = $y * 256 + $x
      if ($mask[$index] -eq 1 -and ($mask[$index-1] -eq 0 -or $mask[$index+1] -eq 0 -or $mask[$index-256] -eq 0 -or $mask[$index+256] -eq 0)) {
        $points.Add(@($x, $y))
      }
    }
  }
  $destination = Join-Path $PSScriptRoot '../src/assets/findus-outline.json'
  $points.ToArray() | ConvertTo-Json -Depth 3 -Compress | Set-Content -LiteralPath $destination -Encoding utf8
  Write-Output "Extracted $($points.Count) outline points."
} finally {
  $graphics.Dispose()
  $sampleBitmap.Dispose()
  $sourceBitmap.Dispose()
}
