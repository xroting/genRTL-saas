# 视频首帧提取工具

一个简单的 PowerShell 工具，用于从视频文件中提取第一帧并保存为 PNG 图片。

## 前置条件

需要安装 FFmpeg：

```powershell
# 方法1: 使用 Chocolatey
choco install ffmpeg

# 方法2: 使用 Winget
winget install Gyan.FFmpeg

# 方法3: 手动下载
# 从 https://ffmpeg.org/download.html 下载并添加到系统 PATH
```

## 使用方法

### 基本用法

```powershell
# 提取视频首帧，自动生成输出文件名
.\extract-first-frame.ps1 -InputVideo "video.mp4"
```

### 指定输出文件

```powershell
# 指定输出文件路径和名称
.\extract-first-frame.ps1 -InputVideo "video.mp4" -OutputImage "thumbnail.png"
```

### 批量处理

```powershell
# 批量处理文件夹中的所有 MP4 视频
Get-ChildItem "*.mp4" | ForEach-Object {
    .\extract-first-frame.ps1 -InputVideo $_.FullName
}
```

## 支持的格式

- **输入**: MP4, AVI, MOV, MKV, FLV, WMV, WEBM
- **输出**: PNG 格式

## 功能特性

- ✅ 自动检测 FFmpeg 是否安装
- ✅ 支持多种视频格式
- ✅ 自动生成输出文件名
- ✅ 文件大小信息显示
- ✅ 详细的错误提示
- ✅ 彩色输出提升用户体验

## 输出文件命名

如果不指定输出文件名，工具会自动在输入视频同目录下生成：
```
input: video.mp4
output: video-frame1.png
```

## 示例输出

```
=== 视频首帧提取工具 ===

🎬 正在提取视频首帧...
输入视频: D:\videos\sample.mp4
输出图片: D:\videos\sample-frame1.png
✅ 视频首帧提取成功！
输出文件: D:\videos\sample-frame1.png
文件大小: 245.67 KB

🎉 操作完成！
```