import Link from "next/link";
import { ArrowLeft, Shield, Users, Building2, Lock, Server, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "企业版 | genRTL",
  description: "为企业团队提供强大的 RTL 设计工具和安全保障"
};

export default function EnterprisePage() {
  const features = [
    {
      icon: Shield,
      title: "SOC 2 认证",
      description: "符合行业安全标准，保护您的知识产权和敏感数据"
    },
    {
      icon: Lock,
      title: "私有部署",
      description: "支持本地部署和私有云部署，完全控制您的数据"
    },
    {
      icon: Server,
      title: "自定义模型",
      description: "使用您自己的 LLM 模型，或在您的基础设施上运行"
    },
    {
      icon: Users,
      title: "团队协作",
      description: "完整的团队管理、权限控制和代码审查工作流"
    },
    {
      icon: Building2,
      title: "私有 CBB 库",
      description: "构建和管理您自己的组件库，在团队内共享"
    },
    {
      icon: Headphones,
      title: "专属支持",
      description: "7x24 小时技术支持，专属客户成功经理"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            为企业团队打造的
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              硬件设计平台
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            安全、可扩展、可控，受超过半数财富 500 强企业信赖
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                联系销售团队
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                查看文档
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">企业级功能</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">受全球领先企业信赖</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
              <div className="text-5xl font-bold text-blue-500 mb-2">50+</div>
              <div className="text-gray-400">财富 500 强企业</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
              <div className="text-5xl font-bold text-purple-500 mb-2">10K+</div>
              <div className="text-gray-400">企业用户</div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8">
              <div className="text-5xl font-bold text-green-500 mb-2">99.9%</div>
              <div className="text-gray-400">服务可用性</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">准备好开始了吗？</h2>
          <p className="text-xl text-gray-400 mb-8">
            与我们的销售团队联系，了解 genRTL 如何帮助您的团队提升效率
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200">
              申请企业试用
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

