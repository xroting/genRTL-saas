# 更新 Vercel 生产环境变量
Write-Host "正在更新 Vercel 生产环境变量..." -ForegroundColor Cyan

# 设置站点 URL
Write-Host "`n[1/1] 设置 NEXT_PUBLIC_SITE_URL..." -ForegroundColor Yellow
$siteUrl = "https://www.xroting.com"
Write-Host "值: $siteUrl" -ForegroundColor Gray

# 使用 echo 传递值
$process = Start-Process -FilePath "vercel" -ArgumentList "env", "add", "NEXT_PUBLIC_SITE_URL", "production" -NoNewWindow -PassThru -RedirectStandardInput "site-url.txt"

# 创建临时文件
$siteUrl | Out-File -FilePath "site-url.txt" -Encoding ascii -NoNewline

# 等待完成
$process.WaitForExit()

# 清理临时文件
Remove-Item "site-url.txt" -ErrorAction SilentlyContinue

Write-Host "`n✓ 环境变量更新完成!" -ForegroundColor Green
Write-Host "`n下一步: 重新部署以应用新的环境变量" -ForegroundColor Yellow
Write-Host "运行: vercel --prod" -ForegroundColor White
