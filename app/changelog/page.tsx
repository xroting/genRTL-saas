import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "更新日志 | genRTL",
  description: "查看 genRTL 的最新功能更新和改进"
};

export default function ChangelogPage() {
  const updates = [
    {
      version: "2.0",
      date: "2026年1月28日",
      title: "CBB 商店上线",
      features: [
        "全新的可配置构建块（CBB）商店",
        "支持购买和集成预构建 IP 核",
        "UART、SPI、AXI、I2C 等常用组件",
        "一键集成到您的项目中"
      ]
    },
    {
      version: "1.9",
      date: "2026年1月16日",
      title: "Agent 模式升级",
      features: [
        "Plan-Implement-Repair 工作流全面优化",
        "支持子代理协作处理复杂任务",
        "改进的代码审查和错误修复能力",
        "更智能的依赖关系管理"
      ]
    },
    {
      version: "1.8",
      date: "2026年1月8日",
      title: "性能改进",
      features: [
        "代码生成速度提升 2x",
        "支持更大规模的设计项目（>100K 行代码）",
        "优化内存使用，降低 30% 资源消耗",
        "改进的并发处理能力"
      ]
    },
    {
      version: "1.7",
      date: "2025年12月22日",
      title: "多工具支持",
      features: [
        "支持 Xilinx Vivado 综合和实现",
        "支持 Intel Quartus 工具链",
        "集成 Synopsys VCS 仿真",
        "支持 Mentor ModelSim/QuestaSim"
      ]
    },
    {
      version: "1.6",
      date: "2025年12月10日",
      title: "企业功能增强",
      features: [
        "团队协作功能上线",
        "代码审查工作流",
        "项目版本管理",
        "私有 CBB 库支持"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold mb-4">更新日志</h1>
        <p className="text-xl text-gray-400 mb-12">
          查看 genRTL 的最新功能更新、改进和修复
        </p>

        {/* Updates List */}
        <div className="space-y-12">
          {updates.map((update, index) => (
            <div
              key={update.version}
              id={update.version}
              className="border-l-2 border-blue-500 pl-6 pb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold">{update.version}</span>
                <span className="text-sm text-gray-500">{update.date}</span>
              </div>
              <h2 className="text-2xl font-semibold mb-4">{update.title}</h2>
              <ul className="space-y-2">
                {update.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">准备好体验最新功能了吗？</p>
          <Link href="/generate">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200">
              开始使用 genRTL
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

