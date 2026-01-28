'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/language-context';

export default function PrivacyPolicyPage() {
  const { currentLanguage } = useLanguage();
  const isZh = currentLanguage === 'zh';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            ← {isZh ? '返回首页' : 'Back to Home'}
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isZh ? '隐私政策（genRTL）' : 'Privacy Policy (genRTL)'}
        </h1>

        <div className="prose prose-gray max-w-none">
          {isZh ? (
            <>
              <p className="text-sm text-gray-600 mb-6">
                生效日期：2026-01-28<br />
                最后更新：2026-01-28
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 运营方信息</h2>
                <p className="text-gray-700 mb-4">
                  genRTL（“本服务”）由 <strong>XROTING TECHNOLOGY LLC</strong>（“我们”）运营。
                  本政策解释你使用 genRTL 的客户端软件、网站、API、文档及相关功能时，我们如何收集、使用、披露与保护你的个人信息与数据。
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>隐私联系邮箱：<a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">privacy@xroting.com</a></li>
                  <li>法律联系邮箱：<a href="mailto:legal@xroting.com" className="text-orange-600 hover:text-orange-700">legal@xroting.com</a></li>
                  <li>注册/邮寄地址：30 N Gould St Ste N, Sheridan, WY 82801, United States</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 适用范围与角色</h2>
                <p className="text-gray-700 mb-4">
                  本政策适用于你作为个人用户或团队成员使用本服务时，我们对个人信息/数据的处理方式。
                </p>
                <p className="text-gray-700 mb-4">
                  若你通过公司/组织购买并使用企业版，且你的雇主（或组织）作为"控制者/Controller"管理你的账号与数据，我们在某些场景下可能作为"处理者/Processor"代表企业客户处理数据，
                  具体以我们与企业客户签署的协议为准（该情形下以企业协议优先）。这一点与行业常见的企业服务数据角色划分一致。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 年龄与未成年人保护</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>本服务面向 <strong>13 岁及以上</strong>用户。</li>
                  <li>我们不会故意收集 13 岁以下儿童个人信息；如发现将尽快核实并删除。</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 我们收集的数据</h2>
                <p className="text-gray-700 mb-4">
                  我们收集的数据取决于你使用的功能与设置（例如是否启用“隐私模式/Privacy Mode”）。
                  行业 AI 编程 IDE 通常会区分隐私模式开启/关闭时的数据保留与训练用途，我们也提供类似的隐私控制逻辑。
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 你直接提供的数据</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>账号信息</strong>：邮箱、用户名、显示名称、头像（如你提供）、团队/组织信息。</li>
                  <li><strong>沟通信息</strong>：你向我们发送的邮件、工单、反馈、调查问卷内容等。</li>
                  <li><strong>付款/订阅信息</strong>：我们通常通过支付处理商（如 Stripe）处理付款；我们会保存必要的对账信息（如订单号、套餐、状态、发票/收据信息）。</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 IDE/AI 功能相关数据（“Inputs / Suggestions”）</h3>
                <p className="text-gray-700 mb-4">
                  genRTL 的 AI 功能允许你提交内容（例如提示词、选择的代码片段、错误日志、工程上下文等，“Inputs”），并生成代码建议/解释/补全/重构补丁等（“Suggestions”）。
                  若你的 Inputs 中包含个人信息或引用外部内容，我们也会处理这些信息，且它们可能出现在 Suggestions 中。
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>提示词与对话内容</strong>：你在聊天/命令面板/补全中输入的文本。</li>
                  <li><strong>代码与工程上下文</strong>：你显式发送给 AI 的代码片段、文件内容、差分补丁、错误日志、编译/仿真输出；以及为实现功能而同步/索引的工程元数据（如文件路径、符号索引、依赖关系）。</li>
                  <li><strong>生成结果</strong>：AI 输出的建议、补全、重构 diff、解释、注释、测试样例等。</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 自动收集的技术与使用数据</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>日志与网络信息</strong>：IP 地址、访问时间、请求路径、错误码、请求标识符、鉴权与安全审计相关日志。</li>
                  <li><strong>设备与应用信息</strong>：设备型号、OS 版本、应用版本、语言/时区、浏览器/User-Agent、崩溃堆栈等诊断信息。</li>
                  <li><strong>使用与性能指标</strong>：功能使用频次、延迟、失败率、资源占用等（通常以聚合/去标识化方式用于稳定性与体验优化）。</li>
                </ul>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-gray-800 mb-0">
                    <strong>重要提示：</strong>请勿在提示词、代码、日志或配置中提交你的密码、API Key、私钥、令牌或其他敏感凭证。
                    若你不慎提交，我们可能出于安全目的进行检测与屏蔽/最小化处理，但无法保证所有场景都能自动识别。
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 我们如何使用数据</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>提供、维护与改进 IDE 与 AI 功能（代码补全、重构、解释、SV/Verilog 规则与工程理解等）。</li>
                  <li>账号注册、登录、身份验证、团队/权限管理与计费。</li>
                  <li>安全防护、滥用检测、反欺诈、速率限制、审计与合规。</li>
                  <li>客户支持、故障排查与性能优化（崩溃/错误分析）。</li>
                  <li>统计分析与产品迭代（通常使用聚合或去标识化数据）。</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 隐私控制：隐私模式与训练用途</h2>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 隐私模式（Privacy Mode）</h3>
                <p className="text-gray-700 mb-4">
                  我们提供隐私设置以控制你的代码与提示词的保留与使用方式。参考行业实践：当启用隐私模式时，模型供应商侧通常会启用“零数据保留（zero data retention）”，
                  服务端可能仍需在最小范围内保存部分数据以提供特定功能（如索引/上下文能力），但你的代码不应被用于训练。
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 模型训练（默认不使用你的代码训练）</h3>
                <p className="text-gray-700 mb-4">
                  默认情况下，我们不会使用你的代码库内容或提示词来训练通用基础模型。
                  若未来推出“允许使用你的数据改进模型/产品”的选项，我们将采用<strong>明确选择同意（opt-in）</strong>方式，并提供可随时撤回的控制。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 数据共享、第三方处理者与跨境传输</h2>
                <p className="text-gray-700 mb-4">
                  我们可能与下列类型第三方共享实现目的所必需的最小数据（并要求其受数据保护与安全条款约束）：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>云与基础设施</strong>：托管、数据库、对象存储、CDN、日志与监控。</li>
                  <li><strong>支付与订阅</strong>：支付处理商与订阅管理服务。</li>
                  <li><strong>AI 模型/推理服务商</strong>：为完成你发起的 AI 请求，可能需要处理 Inputs 与返回 Suggestions。</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  某些推理供应商可能会为提升推理性能临时访问并存储输入/输出，并在使用后删除；这在 AI IDE 行业中较常见，我们会在可行范围内选择提供更强隐私与更短保留周期的供应商。
                </p>
                <p className="text-gray-700 mb-4">
                  如涉及跨境传输（例如 EEA/UK 用户数据传输至其他国家/地区），我们将使用标准合同条款（SCCs）或其他合法机制，并采取适当的技术与组织措施。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 数据保留与删除</h2>
                <p className="text-gray-700 mb-4">
                  我们仅在实现目的所需期间或法律要求期间保留数据，并尽可能最小化。
                  例如访问/安全日志、诊断日志通常会有有限保留期限；账号删除后，我们会在合理期限内删除与账号相关的数据（备份可能会在技术周期内延迟清理）。
                </p>
                <p className="text-gray-700 mb-4">
                  参考行业做法，账号删除通常会触发删除索引与相关数据，并承诺在固定周期内完成从备份中清理。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 安全措施</h2>
                <p className="text-gray-700 mb-4">
                  我们采取加密、访问控制、最小权限、密钥管理、审计与备份等措施保护你的数据。
                  但任何系统都无法保证绝对安全；如发生安全事件，我们将按法律要求与合理方式通知你。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 你的权利与选择</h2>
                <p className="text-gray-700 mb-4">
                  依据适用法律，你可能享有访问、更正、删除、导出、限制处理、撤回同意等权利。
                  你可以通过产品内设置（如可用）或邮件联系我们行使这些权利。
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>邮箱：<a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">privacy@xroting.com</a></li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. 本政策更新</h2>
                <p className="text-gray-700 mb-4">
                  我们可能不时更新本政策，并通过网页公告、应用内提示或邮件通知。你继续使用本服务即表示接受更新后的版本。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. 联系方式</h2>
                <p className="text-gray-700 mb-4">
                  如你对本隐私政策或数据处理有疑问、投诉或权利请求，请联系：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">privacy@xroting.com</a></li>
                  <li><a href="mailto:legal@xroting.com" className="text-orange-600 hover:text-orange-700">legal@xroting.com</a></li>
                </ul>
              </section>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Effective Date: 2026-01-28<br />
                Last Updated: 2026-01-28
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Operator Information</h2>
                <p className="text-gray-700 mb-4">
                  genRTL (the “Service”) is operated by <strong>XROTING TECHNOLOGY LLC</strong> (“we,” “us,” or “our”).
                  This Privacy Policy explains how we collect, use, disclose, and protect personal data when you use genRTL’s client software, website, APIs, documentation, and related features.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Privacy Contact: <a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">privacy@xroting.com</a></li>
                  <li>Legal Contact: <a href="mailto:legal@xroting.com" className="text-orange-600 hover:text-orange-700">legal@xroting.com</a></li>
                  <li>Registered/Mailing Address: 30 N Gould St Ste N, Sheridan, WY 82801, United States</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Scope and Roles</h2>
                <p className="text-gray-700 mb-4">
                  This Policy applies to personal data processed when you use the Service as an individual user or as part of a team.
                </p>
                <p className="text-gray-700 mb-4">
                  If you use an enterprise account managed by your employer/organization, your employer may act as the Controller and we may act as a Processor on their behalf for certain data.
                  In that case, the applicable enterprise agreement controls where it conflicts with this Policy—an approach commonly described in AI IDE privacy policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility and Minors</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>The Service is intended for users <strong>13 years of age or older</strong>.</li>
                  <li>We do not knowingly collect personal data from children under 13; if discovered, we will verify and delete it promptly.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data We Collect</h2>
                <p className="text-gray-700 mb-4">
                  The data we collect depends on the features you use and your settings (e.g., whether “Privacy Mode” is enabled).
                  AI coding IDEs commonly describe different retention/training behaviors depending on privacy settings, and we follow a similar control model.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Data You Provide Directly</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>Account Data</strong>: email, username, display name, avatar (if provided), team/org info.</li>
                  <li><strong>Communications</strong>: emails, support tickets, feedback, survey responses.</li>
                  <li><strong>Billing</strong>: we typically use payment processors (e.g., Stripe). We store necessary billing metadata such as order ID, plan, status, and invoice/receipt details.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 IDE / AI Feature Data (“Inputs” and “Suggestions”)</h3>
                <p className="text-gray-700 mb-4">
                  genRTL’s AI features allow you to submit content (such as prompts, selected code, logs, or project context, “Inputs”) and receive generated code suggestions/explanations/completions/patches (“Suggestions”).
                  If Inputs contain personal data or external content, we will process it and it may appear in Suggestions.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>Prompts & Conversations</strong>: text you enter in chat, command palette, or completion flows.</li>
                  <li><strong>Code & Project Context</strong>: code snippets, file contents, diffs, build/sim logs you explicitly send; and (when required) project metadata used for indexing/context (e.g., file paths, symbol indexes, dependency graphs).</li>
                  <li><strong>Outputs</strong>: suggestions, completions, refactor diffs, explanations, comments, test stubs, etc.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Automatically Collected Technical and Usage Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>Logs</strong>: IP address, timestamps, request paths, error codes, request identifiers, auth/security audit logs.</li>
                  <li><strong>Device/App</strong>: device model, OS version, app version, language/timezone, browser/User-Agent, crash stacks and diagnostics.</li>
                  <li><strong>Usage/Performance</strong>: feature usage frequency, latency, failure rate, resource usage (often aggregated or de-identified for stability improvements).</li>
                </ul>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-gray-800 mb-0">
                    <strong>Important:</strong> Do not include passwords, API keys, private keys, tokens, or other credentials in prompts, code, logs, or configs.
                    If you accidentally do, we may attempt to detect and minimize exposure for security purposes, but we cannot guarantee detection in all cases.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How We Use Data</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Provide, maintain, and improve IDE and AI features (completion, refactoring, explanation, Verilog/SystemVerilog assistance, and project understanding).</li>
                  <li>Account registration, login, authentication, team/permission management, and billing.</li>
                  <li>Security, abuse prevention, fraud detection, rate limiting, auditing, and compliance.</li>
                  <li>Customer support, troubleshooting, and performance optimization.</li>
                  <li>Analytics and product iteration (typically using aggregated or de-identified data).</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy Controls: Privacy Mode and Training</h2>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Privacy Mode</h3>
                <p className="text-gray-700 mb-4">
                  We provide privacy settings to control how your code and prompts are retained and used.
                  Following common industry practice: when Privacy Mode is enabled, “zero data retention” is typically applied at model providers;
                  the Service may still store minimal data needed for certain features (e.g., indexing), but your code should not be used for training.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Model Training (Opt-in)</h3>
                <p className="text-gray-700 mb-4">
                  By default, we do not use your repository content or prompts to train general-purpose foundation models.
                  If we introduce an option to use your data to improve models or AI features, we will use explicit opt-in consent and provide easy withdrawal controls.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sharing, Subprocessors, and International Transfers</h2>
                <p className="text-gray-700 mb-4">
                  We may share limited data with subprocessors as necessary to provide the Service, subject to contractual data protection obligations:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><strong>Cloud/Infrastructure</strong>: hosting, databases, object storage, CDN, logging/monitoring.</li>
                  <li><strong>Payments</strong>: payment processors and subscription management.</li>
                  <li><strong>AI Model / Inference Providers</strong>: to process your Inputs and return Suggestions.</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  Some inference providers may temporarily access/store model inputs and outputs to improve inference performance and delete it after use;
                  this is a common pattern in AI IDE ecosystems, and we aim to select providers with stronger privacy guarantees and shorter retention where feasible.
                </p>
                <p className="text-gray-700 mb-4">
                  For cross-border transfers (e.g., EEA/UK data transfers), we use Standard Contractual Clauses (SCCs) or other lawful mechanisms with appropriate safeguards.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retention and Deletion</h2>
                <p className="text-gray-700 mb-4">
                  We retain data only as long as necessary for the purposes described above or as required by law, and we aim to minimize retention.
                  After account deletion, we delete account-associated data within a reasonable period (backups may expire on a delayed cycle).
                </p>
                <p className="text-gray-700 mb-4">
                  Industry practice often includes deletion of indexed codebases and completion of removal from backups within a defined window.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Security</h2>
                <p className="text-gray-700 mb-4">
                  We use measures such as encryption, access controls, least privilege, key management, audit logging, and backups.
                  However, no system is perfectly secure; if an incident occurs, we will notify you as required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  Depending on applicable law, you may have rights to access, correct, delete, export, restrict processing, and withdraw consent.
                  You can exercise rights via in-product settings (where available) or by contacting us.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Email: <a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">privacy@xroting.com</a></li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Policy from time to time and provide notice via website announcements, in-app notices, or email.
                  Continued use means you accept the updated version.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions, complaints, or privacy rights requests, contact:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li><a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">privacy@xroting.com</a></li>
                  <li><a href="mailto:legal@xroting.com" className="text-orange-600 hover:text-orange-700">legal@xroting.com</a></li>
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2026 XROTING TECHNOLOGY LLC. {isZh ? '保留所有权利。' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </div>
  );
}
