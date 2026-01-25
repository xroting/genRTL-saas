'use client';

import { Check, Cpu, Zap, Crown, Building2, Sparkles, DollarSign } from 'lucide-react';
import { CheckoutForm } from './checkout-form';

interface GenRTLPricingClientProps {
  user: any;
  currentPlan: string;
  prices: any[];
  products: any[];
  hasValidProducts: boolean;
}

// 定义计划类型
interface PlanConfig {
  id: string;
  name: string;
  price: number;
  included_usd: number;
  description: string;
  features: string[];
  limitations?: string[];
  usage_examples?: string[];
  popular?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}

export function GenRTLPricingClient({
  user,
  currentPlan,
  prices,
  products,
  hasValidProducts,
}: GenRTLPricingClientProps) {
  // genRTL 订阅计划配置
  const plans: PlanConfig[] = [
    {
      id: 'hobby',
      name: 'Hobby',
      price: 0,
      included_usd: 0,
      description: '体验版，了解 genRTL 功能',
      icon: <Cpu className="h-6 w-6" />,
      features: [
        '浏览 CBB 商城',
        '查看示例代码',
        '社区支持',
      ],
      limitations: [
        '无法执行任务',
        '无美元池额度',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 20,
      included_usd: 20,
      description: '适合个人开发者和小型项目',
      icon: <Zap className="h-6 w-6" />,
      features: [
        '每月 $20 美元池 (1:1)',
        '~250 次 Plan 任务',
        '~70 次 Implement 任务',
        '~140 次 Repair 任务',
        'CBB 商城完整访问',
        '邮件支持',
      ],
      usage_examples: [
        '小型 FPGA 项目',
        '学习 RTL 设计',
        '原型验证',
      ],
    },
    {
      id: 'professional',
      name: 'Pro',
      price: 100,
      included_usd: 100,
      popular: true,
      badge: '最受欢迎',
      description: '专业团队，大型项目',
      icon: <Crown className="h-6 w-6" />,
      features: [
        '每月 $100 美元池 (1:1)',
        '~1400 次 Plan 任务',
        '~400 次 Implement 任务',
        '~750 次 Repair 任务',
        '10% LLM 费率折扣',
        '支持超额使用（默认限额 $100）',
        '优先队列',
        '24/7 支持',
      ],
      usage_examples: [
        '商业 ASIC 开发',
        '复杂 SoC 设计',
        '团队协作',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 200,
      included_usd: 200,
      description: '企业级，无限制使用',
      icon: <Building2 className="h-6 w-6" />,
      features: [
        '每月 $200 美元池 (1:1)',
        '~3100 次 Plan 任务',
        '~900 次 Implement 任务',
        '~1700 次 Repair 任务',
        '20% LLM 费率折扣',
        '无限超额使用',
        '专属 CBB 包',
        '专属技术支持',
        'SLA 99.9%',
        '定制化服务',
      ],
      usage_examples: [
        '企业级芯片设计',
        '高频交易',
        '关键任务应用',
      ],
    },
  ];

  // 从 products 和 prices 中匹配对应的 priceId
  const getPriceIdForPlan = (planId: string) => {
    const product = products.find(
      (p) => p.metadata?.plan_key === planId || p.name.toLowerCase().includes(planId)
    );
    if (!product) return null;
    return prices.find((price) => price.productId === product.id)?.id || null;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          genRTL 订阅计划
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          根据您的需求选择合适的计划，基于 USD Pool 的灵活计费方式，支持 LLM 调用和 CBB 包购买
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-16">
        {plans.map((plan) => {
          const priceId = getPriceIdForPlan(plan.id);
          const isCurrentPlan = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl p-8 transition-transform hover:scale-105 ${
                plan.popular ? 'ring-2 ring-orange-500 shadow-2xl' : ''
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  {plan.badge}
                </span>
              )}

              {/* Plan Header */}
              <div className="flex items-center mb-4">
                <div className={`mr-3 ${plan.popular ? 'text-orange-500' : 'text-gray-600'}`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              </div>

              <p className="text-sm text-gray-600 mb-6 h-12">{plan.description}</p>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="ml-2 text-gray-600">/月</span>
                  )}
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-gray-700 font-medium">
                    ${plan.included_usd} 美元池/月
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div>
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    当前计划
                  </button>
                ) : plan.id === 'hobby' ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    免费计划
                  </button>
                ) : hasValidProducts && priceId ? (
                  <CheckoutForm priceId={priceId} />
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    配置中...
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          功能对比
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">功能</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Hobby</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Basic</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Pro</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 px-4 text-gray-700">美元池/月</td>
                <td className="py-4 px-4 text-center text-gray-900">$10</td>
                <td className="py-4 px-4 text-center text-gray-900">$60</td>
                <td className="py-4 px-4 text-center text-gray-900">$350</td>
                <td className="py-4 px-4 text-center text-gray-900">$800</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Plan 任务</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Implement 任务</td>
                <td className="py-4 px-4 text-center">❌</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">Repair 任务</td>
                <td className="py-4 px-4 text-center">❌</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">CBB 商城</td>
                <td className="py-4 px-4 text-center">❌</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
                <td className="py-4 px-4 text-center">✅</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">On-Demand 超额</td>
                <td className="py-4 px-4 text-center">❌</td>
                <td className="py-4 px-4 text-center">❌</td>
                <td className="py-4 px-4 text-center">✅ (限额 $200)</td>
                <td className="py-4 px-4 text-center">✅ (无限制)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-700">LLM 费率 (Plan)</td>
                <td className="py-4 px-4 text-center text-sm">$0.03/1K</td>
                <td className="py-4 px-4 text-center text-sm">$0.025/1K</td>
                <td className="py-4 px-4 text-center text-sm">$0.02/1K</td>
                <td className="py-4 px-4 text-center text-sm">$0.015/1K</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* On-Demand Explanation */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Zap className="h-6 w-6 text-orange-500 mr-2" />
          什么是 On-Demand（超额使用）？
        </h2>
        <p className="text-gray-700 mb-4">
          当您的美元池（Included USD）用完后，Pro 和 Enterprise 计划支持继续使用服务，
          费用会计入 On-Demand（超额使用），在下个计费周期一并结算。
        </p>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>Pro 计划：默认限额 $200，可自行调整</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>Enterprise 计划：无限制，可设置安全阈值</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>每月1日自动重置美元池，On-Demand 清零</span>
          </li>
        </ul>
      </div>

      {/* FAQ */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">还有疑问？</h2>
        <p className="text-gray-600 mb-6">
          我们的团队随时准备帮助您选择最适合的计划
        </p>
        <a
          href="mailto:support@genrtl.com"
          className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
        >
          联系我们
        </a>
      </div>
    </main>
  );
}

