# DNS 检查脚本
# 用于诊断 www.xroting.com 的 DNS 配置问题

Write-Host "================================" -ForegroundColor Cyan
Write-Host "DNS 配置诊断工具" -ForegroundColor Cyan
Write-Host "域名: www.xroting.com" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. 检查本地 DNS
Write-Host "[1] 检查本地 DNS 解析..." -ForegroundColor Yellow
try {
    $local = Resolve-DnsName www.xroting.com -Type A -ErrorAction Stop
    Write-Host "   本地 DNS 结果:" -ForegroundColor Green
    $local | Where-Object {$_.Type -eq 'A'} | ForEach-Object {
        Write-Host "   -> IP: $($_.IPAddress)" -ForegroundColor White
    }
} catch {
    Write-Host "   本地 DNS 查询失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. 检查 Google DNS (8.8.8.8)
Write-Host "[2] 检查 Google DNS (8.8.8.8)..." -ForegroundColor Yellow
try {
    $google = Resolve-DnsName www.xroting.com -Type A -Server 8.8.8.8 -ErrorAction Stop
    Write-Host "   Google DNS 结果:" -ForegroundColor Green
    $google | Where-Object {$_.Type -eq 'A'} | ForEach-Object {
        Write-Host "   -> IP: $($_.IPAddress)" -ForegroundColor White
    }
} catch {
    Write-Host "   Google DNS 查询失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. 检查 Cloudflare DNS (1.1.1.1)
Write-Host "[3] 检查 Cloudflare DNS (1.1.1.1)..." -ForegroundColor Yellow
try {
    $cloudflare = Resolve-DnsName www.xroting.com -Type A -Server 1.1.1.1 -ErrorAction Stop
    Write-Host "   Cloudflare DNS 结果:" -ForegroundColor Green
    $cloudflare | Where-Object {$_.Type -eq 'A'} | ForEach-Object {
        Write-Host "   -> IP: $($_.IPAddress)" -ForegroundColor White
    }
} catch {
    Write-Host "   Cloudflare DNS 查询失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. 检查 CNAME 记录
Write-Host "[4] 检查 CNAME 记录..." -ForegroundColor Yellow
try {
    $cname = Resolve-DnsName www.xroting.com -Type CNAME -Server 8.8.8.8 -ErrorAction Stop
    Write-Host "   CNAME 记录:" -ForegroundColor Green
    $cname | Where-Object {$_.Type -eq 'CNAME'} | ForEach-Object {
        Write-Host "   -> 指向: $($_.NameHost)" -ForegroundColor White
    }
} catch {
    Write-Host "   未找到 CNAME 记录" -ForegroundColor Gray
}

Write-Host ""

# 5. 检查 GoDaddy Nameservers
Write-Host "[5] 查询 GoDaddy 权威 DNS (ns55.domaincontrol.com)..." -ForegroundColor Yellow
try {
    $godaddy = Resolve-DnsName www.xroting.com -Type A -Server ns55.domaincontrol.com -ErrorAction Stop
    Write-Host "   GoDaddy DNS 结果:" -ForegroundColor Green
    $godaddy | Where-Object {$_.Type -eq 'A'} | ForEach-Object {
        Write-Host "   -> IP: $($_.IPAddress)" -ForegroundColor White
    }
} catch {
    Write-Host "   GoDaddy DNS 查询失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   这说明 www 记录在 GoDaddy 中不存在!" -ForegroundColor Red
}

Write-Host ""

# 6. 期望结果
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[期望配置]" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "方案 1 (推荐):" -ForegroundColor Green
Write-Host "  类型: CNAME" -ForegroundColor White
Write-Host "  名称: www" -ForegroundColor White
Write-Host "  值: cname.vercel-dns.com" -ForegroundColor White
Write-Host ""
Write-Host "方案 2:" -ForegroundColor Green
Write-Host "  类型: A" -ForegroundColor White
Write-Host "  名称: www" -ForegroundColor White
Write-Host "  值: 76.76.21.21" -ForegroundColor White
Write-Host ""

# 7. 诊断结果
Write-Host "================================" -ForegroundColor Cyan
Write-Host "[诊断结果]" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$expectedIP = "76.76.21.21"
$expectedCNAME = "cname.vercel-dns.com"

try {
    $check = Resolve-DnsName www.xroting.com -Type A -Server 8.8.8.8 -ErrorAction Stop
    $currentIP = ($check | Where-Object {$_.Type -eq 'A'} | Select-Object -First 1).IPAddress

    if ($currentIP -eq $expectedIP) {
        Write-Host "✓ DNS 配置正确! IP 指向 $expectedIP" -ForegroundColor Green
        Write-Host "✓ 等待 SSL 证书生成 (1-5分钟)" -ForegroundColor Green
    } else {
        Write-Host "✗ DNS 配置错误!" -ForegroundColor Red
        Write-Host "  当前 IP: $currentIP" -ForegroundColor Red
        Write-Host "  期望 IP: $expectedIP" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "建议操作:" -ForegroundColor Yellow
        Write-Host "1. 检查 GoDaddy DNS 管理页面" -ForegroundColor White
        Write-Host "2. 确认是否添加了 www 的 A 或 CNAME 记录" -ForegroundColor White
        Write-Host "3. 如果没有,请添加 CNAME 记录指向 cname.vercel-dns.com" -ForegroundColor White
        Write-Host "4. 如果有但 IP 不对,请修改或删除后重新添加" -ForegroundColor White
    }
} catch {
    Write-Host "✗ DNS 记录不存在!" -ForegroundColor Red
    Write-Host ""
    Write-Host "建议操作:" -ForegroundColor Yellow
    Write-Host "1. 前往 GoDaddy DNS 管理: https://dcc.godaddy.com/manage/xroting.com/dns" -ForegroundColor White
    Write-Host "2. 点击 '添加记录' 或 'Add'" -ForegroundColor White
    Write-Host "3. 添加 CNAME 记录:" -ForegroundColor White
    Write-Host "   类型: CNAME" -ForegroundColor Gray
    Write-Host "   名称: www" -ForegroundColor Gray
    Write-Host "   值: cname.vercel-dns.com" -ForegroundColor Gray
    Write-Host "4. 保存并等待 5-10 分钟" -ForegroundColor White
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "检查完成!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
