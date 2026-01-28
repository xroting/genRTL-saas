'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/language-context';

export default function SecurityPage() {
  const { currentLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <Link href="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← {currentLanguage === 'zh' ? '返回首页' : 'Back to Home'}
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {currentLanguage === 'zh' ? '安全性（genRTL）' : 'Security (genRTL)'}
        </h1>

        <div className="prose prose-gray max-w-none">
          {currentLanguage === 'zh' ? (
            <>
              <p className="text-sm text-gray-600 mb-6">
                生效日期：2026-01-28
                <br />
                最后更新：2026-01-28
              </p>

              <section className="mb-8">
                <p className="text-gray-700 mb-4">
                  我们非常重视你的源代码与开发环境安全。本页面用于说明 genRTL（面向 Verilog/SystemVerilog
                  的 AI 编程 IDE）在安全与数据保护方面的做法与承诺。
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>说明：</strong>本页面为信息披露，不构成合同条款；如与《服务条款》或《隐私政策》冲突，以后者为准。
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    安全问题咨询：{' '}
                    <a href="mailto:security@xroting.com" className="text-orange-600 hover:text-orange-700">
                      security@xroting.com
                    </a>
                  </li>
                  <li>
                    漏洞报告：{' '}
                    <a
                      href="mailto:security-reports@xroting.com"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      security-reports@xroting.com
                    </a>
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">目录</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>
                    <a href="#certifications" className="text-orange-600 hover:text-orange-700">
                      1. 认证与第三方评估
                    </a>
                  </li>
                  <li>
                    <a href="#infrastructure" className="text-orange-600 hover:text-orange-700">
                      2. 基础设施安全
                    </a>
                  </li>
                  <li>
                    <a href="#client" className="text-orange-600 hover:text-orange-700">
                      3. 客户端安全
                    </a>
                  </li>
                  <li>
                    <a href="#ai-requests" className="text-orange-600 hover:text-orange-700">
                      4. AI 请求与数据传输
                    </a>
                  </li>
                  <li>
                    <a href="#indexing" className="text-orange-600 hover:text-orange-700">
                      5. 代码索引与向量化
                    </a>
                  </li>
                  <li>
                    <a href="#privacy-mode" className="text-orange-600 hover:text-orange-700">
                      6. 隐私模式（Privacy Mode）
                    </a>
                  </li>
                  <li>
                    <a href="#account-deletion" className="text-orange-600 hover:text-orange-700">
                      7. 账号删除与数据保留
                    </a>
                  </li>
                  <li>
                    <a href="#vuln" className="text-orange-600 hover:text-orange-700">
                      8. 漏洞披露
                    </a>
                  </li>
                </ul>
              </section>

              <section id="certifications" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 认证与第三方评估</h2>
                <p className="text-gray-700 mb-4">
                  genRTL 当前<strong>正在进行 SOC 2 Type II</strong> 认证。我们计划随着产品成熟逐步推进第三方审计与渗透测试，并在获得结果后在本页面更新。
                </p>
              </section>

              <section id="infrastructure" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 基础设施安全</h2>
                <p className="text-gray-700 mb-4">
                  我们在设计与运营中遵循“最小权限、分层防护、默认安全（secure by default）”原则，并采用行业常见的安全控制措施，包括但不限于：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    <strong>传输与存储加密</strong>：对网络传输使用 TLS；对敏感数据使用加密存储（如适用）。
                  </li>
                  <li>
                    <strong>访问控制</strong>：基于最小权限分配访问；关键系统启用多因素认证（如适用）；对管理操作进行审计。
                  </li>
                  <li>
                    <strong>密钥与机密管理</strong>：将 API Key、密钥等机密通过受控的密钥/机密管理方案保存与轮换（如适用）。
                  </li>
                  <li>
                    <strong>监控与告警</strong>：对异常访问、错误率、可疑行为进行监控与告警（如适用）。
                  </li>
                  <li>
                    <strong>变更管理</strong>：对生产变更进行审阅与记录，并尽量采用分阶段发布与回滚策略（如适用）。
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 次级处理方（Subprocessors）</h3>
                <p className="text-gray-700 mb-4">
                  为提供 AI 代码辅助能力，genRTL 默认仅使用以下次级处理方。除非你显式选择或配置其它集成，否则我们不会将你的 AI 请求发送给其它模型供应商。
                </p>

                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full text-sm border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-b border-gray-200">次级处理方</th>
                        <th className="text-left p-3 border-b border-gray-200">用途</th>
                        <th className="text-left p-3 border-b border-gray-200">可能处理的数据</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-gray-200">
                          <a
                            href="https://www.anthropic.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Anthropic
                          </a>
                        </td>
                        <td className="p-3 border-b border-gray-200">大模型推理（生成/改写/解释代码）</td>
                        <td className="p-3 border-b border-gray-200">
                          你提交的提示词、对话上下文、以及为完成任务而选取的相关代码片段/元数据（如文件名、行号等，取决于功能与设置）
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-gray-700 mb-4">
                  <strong>重要提示：</strong>AI 功能可能会将你选择的上下文（例如当前文件片段、错误日志、相关工程信息）发送到我们的服务器与 Anthropic
                  进行处理。你应避免在提示词或上下文中包含不必要的敏感信息（例如私钥、密码、商业机密等）。
                </p>
              </section>

              <section id="client" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 客户端安全</h2>
                <p className="text-gray-700 mb-4">
                  genRTL IDE 基于 VS Code 生态的开源代码基座（如 VSCodium/VS Code 兼容分支）构建。我们会关注上游安全公告与修复，并在必要时优先合并高风险安全补丁。
                </p>
                <p className="text-gray-700 mb-4">
                  同时，扩展生态本身可能带来供应链风险。建议你仅安装可信来源的扩展，并在组织环境中配置统一的扩展白名单/策略（如适用）。
                </p>
              </section>

              <section id="ai-requests" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI 请求与数据传输</h2>
                <p className="text-gray-700 mb-4">
                  为实现聊天问答、代码补全、重构、错误解释、Agent 工具调用等功能，genRTL 会向后端发起 AI 请求。一次 AI 请求通常包含：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>你的提示词与对话历史（必要时）</li>
                  <li>与你当前任务相关的代码片段（例如当前文件选区、定位到的相关模块/信号、编译/仿真日志片段）</li>
                  <li>最小化的元信息（例如语言类型 Verilog/SystemVerilog、工具链信息、错误码等）</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 忽略规则（建议）</h3>
                <p className="text-gray-700 mb-4">
                  为减少敏感文件被纳入上下文，你可以在工程中设置忽略规则（例如沿用 <code>.gitignore</code> 的理念，或配置专用的 <code>.genrtlignore</code>）。
                  genRTL 会尽力避免将被忽略的路径内容发送到 AI 请求中。
                </p>
              </section>

              <section id="indexing" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 代码索引与向量化</h2>
                <p className="text-gray-700 mb-4">
                  为实现跨文件语义检索、快速定位模块/接口、RAG 辅助生成等能力，genRTL 可能提供“代码索引”功能。一般而言：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>索引会扫描你打开的工程目录（受忽略规则限制），对代码进行分块并生成向量表示（embeddings）。</li>
                  <li>我们倾向于在服务端存储必要的索引数据（如 embeddings 与最小元数据），并尽量避免长期保存明文源代码（取决于功能与配置）。</li>
                  <li>索引可在设置中关闭（如你的部署/版本支持）。</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>风险提示：</strong>即便只存储 embeddings，学术研究表明在某些条件下存在“向量反推”风险。若你处于高度敏感环境，建议谨慎启用索引并结合隐私模式与忽略规则使用。
                </p>
              </section>

              <section id="privacy-mode" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 隐私模式（Privacy Mode）</h2>
                <p className="text-gray-700 mb-4">
                  隐私模式旨在最小化代码与提示词的持久化存储，并限制数据用于训练/改进。不同版本的实现可能有所差异，但总体目标包括：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    <strong>最小化保留</strong>：仅在完成请求所需的时间窗口内处理必要上下文，尽量避免长期保存明文代码与敏感日志。
                  </li>
                  <li>
                    <strong>训练限制</strong>：我们默认不使用你的代码内容进行模型训练；如未来提供相关能力，我们将采用明确的“显式同意（opt-in）”机制。
                  </li>
                  <li>
                    <strong>次级处理方约束</strong>：对 Anthropic 的请求遵循双方协议与其公开的数据使用政策，并尽量选择最小化留存的配置选项（如可用）。
                  </li>
                </ul>
                <p className="text-gray-700 mb-4">
                  如果你需要更严格的保障（例如企业合规、内部审计、专有部署等），请联系我们：{' '}
                  <a href="mailto:security@xroting.com" className="text-orange-600 hover:text-orange-700">
                    security@xroting.com
                  </a>
                </p>
              </section>

              <section id="account-deletion" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 账号删除与数据保留</h2>
                <p className="text-gray-700 mb-4">
                  你可以通过产品内设置（如可用）或通过邮件联系我们来申请删除账号与相关数据：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    隐私请求：{' '}
                    <a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">
                      privacy@xroting.com
                    </a>
                  </li>
                  <li>
                    法务请求：{' '}
                    <a href="mailto:legal@xroting.com" className="text-orange-600 hover:text-orange-700">
                      legal@xroting.com
                    </a>
                  </li>
                </ul>
                <p className="text-gray-700 mb-4">
                  我们会在合理期限内处理删除请求；某些数据可能因备份、法定义务或争议处理需要而保留一段时间，具体以《隐私政策》与适用法律为准。
                </p>
              </section>

              <section id="vuln" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 漏洞披露</h2>
                <p className="text-gray-700 mb-4">
                  如果你认为发现了 genRTL 的安全漏洞，请将复现步骤、影响范围与可能的修复建议发送至：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    <a
                      href="mailto:security-reports@xroting.com"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      security-reports@xroting.com
                    </a>
                  </li>
                </ul>
                <p className="text-gray-700 mb-4">
                  我们会尽快确认收到并进行评估。在必要情况下，我们将通过邮件或站内公告向受影响用户发布安全通告与修复建议。
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-6">
                Effective Date: 2026-01-28
                <br />
                Last Updated: 2026-01-28
              </p>

              <section className="mb-8">
                <p className="text-gray-700 mb-4">
                  Keeping your source code and developer environment secure is important to us. This page describes genRTL
                  (an AI programming IDE focused on Verilog/SystemVerilog) and our approach to security and data
                  protection.
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Note:</strong> This page is informational and does not form a contract. If anything here
                  conflicts with our Terms of Service or Privacy Policy, those documents control.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    Security questions:{' '}
                    <a href="mailto:security@xroting.com" className="text-orange-600 hover:text-orange-700">
                      security@xroting.com
                    </a>
                  </li>
                  <li>
                    Vulnerability reports:{' '}
                    <a
                      href="mailto:security-reports@xroting.com"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      security-reports@xroting.com
                    </a>
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>
                    <a href="#certifications" className="text-orange-600 hover:text-orange-700">
                      1. Certifications & third-party assessments
                    </a>
                  </li>
                  <li>
                    <a href="#infrastructure" className="text-orange-600 hover:text-orange-700">
                      2. Infrastructure security
                    </a>
                  </li>
                  <li>
                    <a href="#client" className="text-orange-600 hover:text-orange-700">
                      3. Client security
                    </a>
                  </li>
                  <li>
                    <a href="#ai-requests" className="text-orange-600 hover:text-orange-700">
                      4. AI requests & data transfer
                    </a>
                  </li>
                  <li>
                    <a href="#indexing" className="text-orange-600 hover:text-orange-700">
                      5. Codebase indexing
                    </a>
                  </li>
                  <li>
                    <a href="#privacy-mode" className="text-orange-600 hover:text-orange-700">
                      6. Privacy Mode
                    </a>
                  </li>
                  <li>
                    <a href="#account-deletion" className="text-orange-600 hover:text-orange-700">
                      7. Account deletion & retention
                    </a>
                  </li>
                  <li>
                    <a href="#vuln" className="text-orange-600 hover:text-orange-700">
                      8. Vulnerability disclosure
                    </a>
                  </li>
                </ul>
              </section>

              <section id="certifications" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Certifications & third-party assessments</h2>
                <p className="text-gray-700 mb-4">
                  genRTL is <strong> SOC 2 Type II certifing</strong>. As the product matures, we plan to pursue
                  additional third-party audits and penetration testing, and will update this page when available.
                </p>
              </section>

              <section id="infrastructure" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Infrastructure security</h2>
                <p className="text-gray-700 mb-4">
                  We follow standard security principles such as least privilege, defense-in-depth, and secure-by-default
                  design. Common controls we implement (as applicable) include:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    <strong>Encryption</strong>: TLS in transit; encryption at rest for sensitive data (as applicable).
                  </li>
                  <li>
                    <strong>Access controls</strong>: least-privilege access, MFA for critical systems (as applicable),
                    and audit logging for administrative actions.
                  </li>
                  <li>
                    <strong>Secrets management</strong>: controlled storage and rotation of API keys and secrets (as
                    applicable).
                  </li>
                  <li>
                    <strong>Monitoring & alerting</strong>: monitoring for suspicious behavior and operational anomalies
                    (as applicable).
                  </li>
                  <li>
                    <strong>Change management</strong>: reviewable, traceable deployments with safe rollout/rollback
                    strategies (as applicable).
                  </li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Subprocessors</h3>
                <p className="text-gray-700 mb-4">
                  To provide AI features, genRTL currently relies on the following subprocessor by default. Unless you
                  explicitly select or configure otherwise, we do not route your AI requests to other model providers.
                </p>

                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full text-sm border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-b border-gray-200">Subprocessor</th>
                        <th className="text-left p-3 border-b border-gray-200">Purpose</th>
                        <th className="text-left p-3 border-b border-gray-200">Data potentially processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-gray-200">
                          <a
                            href="https://www.anthropic.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Anthropic
                          </a>
                        </td>
                        <td className="p-3 border-b border-gray-200">LLM inference (generate/refactor/explain code)</td>
                        <td className="p-3 border-b border-gray-200">
                          Your prompts, conversation context, and relevant code snippets/metadata selected for the task
                          (e.g., filenames, line ranges—depending on features and settings)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-gray-700 mb-4">
                  <strong>Important:</strong> AI features may send selected context (e.g., file snippets, error logs, or
                  repo context) to our servers and Anthropic for processing. Avoid including unnecessary sensitive data
                  (e.g., private keys, passwords, trade secrets) in prompts or context.
                </p>
              </section>

              <section id="client" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Client security</h2>
                <p className="text-gray-700 mb-4">
                  genRTL is built on a VS Code-compatible open-source base (e.g., VSCodium / VS Code-compatible forks).
                  We monitor upstream security advisories and prioritize high-severity patches when needed.
                </p>
                <p className="text-gray-700 mb-4">
                  Extension ecosystems can introduce supply-chain risk. We recommend installing extensions only from
                  trusted sources and using an allowlist policy in enterprise environments (as applicable).
                </p>
              </section>

              <section id="ai-requests" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI requests & data transfer</h2>
                <p className="text-gray-700 mb-4">
                  To power chat, code completion, refactoring, error explanations, and agent/tool workflows, genRTL makes
                  AI requests to our backend. A request may include:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Your prompt and (when needed) conversation history</li>
                  <li>Task-relevant code snippets (e.g., selection, related modules/signals, build/sim log excerpts)</li>
                  <li>Minimal metadata (e.g., Verilog/SystemVerilog, toolchain info, error codes)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Ignore rules (recommended)</h3>
                <p className="text-gray-700 mb-4">
                  To reduce accidental inclusion of sensitive files, configure ignore rules (similar in spirit to{' '}
                  <code>.gitignore</code>, or via a dedicated <code>.genrtlignore</code>). genRTL will make best efforts
                  to exclude ignored paths from AI context.
                </p>
              </section>

              <section id="indexing" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Codebase indexing</h2>
                <p className="text-gray-700 mb-4">
                  genRTL may offer codebase indexing to enable semantic search and retrieval-augmented generation across
                  your repository. In general:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Indexing scans your project directory (subject to ignore rules), chunks code, and generates embeddings.</li>
                  <li>We aim to store only what is necessary for search (e.g., embeddings and minimal metadata) and minimize long-term plaintext storage (depending on features and settings).</li>
                  <li>Indexing can be disabled in settings (where supported).</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  <strong>Risk note:</strong> Even embeddings can carry leakage risk under certain attack models. If you
                  work in a highly sensitive environment, consider disabling indexing and using Privacy Mode plus ignore
                  rules.
                </p>
              </section>

              <section id="privacy-mode" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy Mode</h2>
                <p className="text-gray-700 mb-4">
                  Privacy Mode is designed to minimize retention of code/prompts and restrict use for training or product
                  improvement. Exact behavior can vary by version, but our goals include:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    <strong>Minimized retention</strong>: process necessary context transiently and avoid long-term plaintext storage where possible.
                  </li>
                  <li>
                    <strong>Training restrictions</strong>: we do not train on your code content by default; any future training capability would be explicit opt-in.
                  </li>
                  <li>
                    <strong>Subprocessor constraints</strong>: requests sent to Anthropic follow our agreement and their published data-use policies, using minimal-retention options where available.
                  </li>
                </ul>
                <p className="text-gray-700 mb-4">
                  For enterprise requirements (compliance reviews, audit needs, private deployments), contact:{' '}
                  <a href="mailto:security@xroting.com" className="text-orange-600 hover:text-orange-700">
                    security@xroting.com
                  </a>
                </p>
              </section>

              <section id="account-deletion" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Account deletion & retention</h2>
                <p className="text-gray-700 mb-4">
                  You may request account deletion via in-product settings (where available) or by contacting us:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    Privacy requests:{' '}
                    <a href="mailto:privacy@xroting.com" className="text-orange-600 hover:text-orange-700">
                      privacy@xroting.com
                    </a>
                  </li>
                  <li>
                    Legal requests:{' '}
                    <a href="mailto:legal@xroting.com" className="text-orange-600 hover:text-orange-700">
                      legal@xroting.com
                    </a>
                  </li>
                </ul>
                <p className="text-gray-700 mb-4">
                  We process deletion requests within a reasonable timeframe. Certain data may be retained temporarily
                  due to backups, legal obligations, or dispute resolution, as described in our Privacy Policy and
                  applicable law.
                </p>
              </section>

              <section id="vuln" className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Vulnerability disclosure</h2>
                <p className="text-gray-700 mb-4">
                  If you believe you found a security vulnerability in genRTL, please email a report with reproduction
                  steps and impact to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>
                    <a
                      href="mailto:security-reports@xroting.com"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      security-reports@xroting.com
                    </a>
                  </li>
                </ul>
                <p className="text-gray-700 mb-4">
                  We will acknowledge receipt and assess promptly. When appropriate, we will communicate critical issues
                  and mitigations via email or in-product notices.
                </p>
              </section>
            </>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2026 XROTING TECHNOLOGY LLC. {currentLanguage === 'zh' ? '保留所有权利。' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </div>
  );
}
