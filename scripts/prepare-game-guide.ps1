$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$guideRoot = Split-Path -Parent $PSScriptRoot
$englishPath = Join-Path $guideRoot 'docs/guide/guide-en.png'
$hebrewPath = Join-Path $guideRoot 'docs/guide/guide-he.png'
$outputPath = Join-Path $guideRoot 'dist/assets/game-guide.png'

# Copy the reviewed posters at their original size. Never redraw or resample text.
function Get-PixelHash([System.Drawing.Bitmap]$Bitmap) {
    $area = [System.Drawing.Rectangle]::new(0, 0, $Bitmap.Width, $Bitmap.Height)
    $locked = $Bitmap.LockBits($area, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $bytes = [byte[]]::new([Math]::Abs($locked.Stride) * $Bitmap.Height)
        [System.Runtime.InteropServices.Marshal]::Copy($locked.Scan0, $bytes, 0, $bytes.Length)
        $sha = [System.Security.Cryptography.SHA256]::Create()
        try { return [BitConverter]::ToString($sha.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant() }
        finally { $sha.Dispose() }
    } finally { $Bitmap.UnlockBits($locked) }
}

$english = [System.Drawing.Bitmap]::new($englishPath)
$hebrew = [System.Drawing.Bitmap]::new($hebrewPath)
$combined = $null
try {
    if ($english.Height -ne $hebrew.Height) { throw 'Guide posters must have the same height.' }
    $combined = [System.Drawing.Bitmap]::new($english.Width + $hebrew.Width, $english.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($combined)
    try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.DrawImageUnscaled($english, 0, 0)
        $graphics.DrawImageUnscaled($hebrew, $english.Width, 0)
    } finally { $graphics.Dispose() }
    $combined.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $saved = [System.Drawing.Bitmap]::new($outputPath)
    try {
        $left = $saved.Clone([System.Drawing.Rectangle]::new(0, 0, $english.Width, $english.Height), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $right = $saved.Clone([System.Drawing.Rectangle]::new($english.Width, 0, $hebrew.Width, $hebrew.Height), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $englishHash = Get-PixelHash $english
            $hebrewHash = Get-PixelHash $hebrew
            if ((Get-PixelHash $left) -ne $englishHash -or (Get-PixelHash $right) -ne $hebrewHash) { throw 'The combined guide must preserve every source pixel.' }
        } finally { $left.Dispose(); $right.Dispose() }
    } finally { $saved.Dispose() }
    $review = [ordered]@{
        file = 'dist/assets/game-guide.png'
        width = $combined.Width
        height = $combined.Height
        composition = 'English left, Hebrew right; original size; no resampling'
        leftSource = 'docs/guide/guide-en.png'
        rightSource = 'docs/guide/guide-he.png'
        leftPixelsSha256 = $englishHash
        rightPixelsSha256 = $hebrewHash
        everySourcePixelPreserved = $true
        imageSha256 = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $review | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'game-guide-image-review.json') -Encoding utf8
    $review | ConvertTo-Json -Compress
} finally {
    $english.Dispose(); $hebrew.Dispose()
    if ($combined) { $combined.Dispose() }
}
