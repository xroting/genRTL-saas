'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/language-context';

const EFFECTIVE_DATE = '2026-01-28';
const LAST_UPDATED = '2026-01-28';

const COMPANY_NAME = 'XROTING TECHNOLOGY LLC';
const PRODUCT_NAME = 'genRTL / avlog（Verilog/SV AI IDE）';

const LEGAL_EMAIL = 'legal@xroting.com';
const SUPPORT_EMAIL = 'support@xroting.com';

function DateBlock({ lang }: { lang: 'zh' | 'en' | 'ja' }) {
  if (lang === 'zh') {
    return (
      <p className="text-sm text-gray-600 mb-6">
        生效日期：{EFFECTIVE_DATE}
        <br />
        最后更新：{LAST_UPDATED}
      </p>
    );
  }
  if (lang === 'ja') {
    return (
      <p className="text-sm text-gray-600 mb-6">
        発効日：{EFFECTIVE_DATE}
        <br />
        最終更新日：{LAST_UPDATED}
      </p>
    );
  }
  return (
    <p className="text-sm text-gray-600 mb-6">
      Effective Date: {EFFECTIVE_DATE}
      <br />
      Last Updated: {LAST_UPDATED}
    </p>
  );
}

function TOC({ lang }: { lang: 'zh' | 'en' | 'ja' }) {
  const title =
    lang === 'zh' ? '目录' : lang === 'ja' ? '目次' : 'Table of Contents';
  const items =
    lang === 'zh'
      ? [
          ['#sec-1', '1. 访问与使用'],
          ['#sec-2', '2. 资格'],
          ['#sec-3', '3. 账户注册与访问'],
          ['#sec-4', '4. 付款条款'],
          ['#sec-5', '5. 所有权与许可'],
          ['#sec-6', '6. 第三方服务与本地工具'],
          ['#sec-7', '7. 通信'],
          ['#sec-8', '8. 条款修改'],
          ['#sec-9', '9. 终止'],
          ['#sec-10', '10. 服务的修改'],
          ['#sec-11', '11. 版权投诉（DMCA）'],
          ['#sec-12', '12. 隐私'],
          ['#sec-13', '13. 赔偿'],
          ['#sec-14', '14. 免责声明'],
          ['#sec-15', '15. 责任限制'],
          ['#sec-16', '16. 争议解决'],
          ['#sec-17', '17. 杂项（含出口与贸易管制）'],
          ['#sec-18', '18. 联系我们'],
        ]
      : lang === 'ja'
        ? [
            ['#sec-1', '1. アクセスと利用'],
            ['#sec-2', '2. 利用資格'],
            ['#sec-3', '3. アカウント登録とアクセス'],
            ['#sec-4', '4. 支払条件'],
            ['#sec-5', '5. 所有権とライセンス'],
            ['#sec-6', '6. 第三者サービスとローカルツール'],
            ['#sec-7', '7. コミュニケーション'],
            ['#sec-8', '8. 条項の変更'],
            ['#sec-9', '9. 終了'],
            ['#sec-10', '10. サービスの変更'],
            ['#sec-11', '11. 著作権申立て（DMCA）'],
            ['#sec-12', '12. プライバシー'],
            ['#sec-13', '13. 補償'],
            ['#sec-14', '14. 免責'],
            ['#sec-15', '15. 責任制限'],
            ['#sec-16', '16. 紛争解決'],
            ['#sec-17', '17. その他（輸出・貿易管理を含む）'],
            ['#sec-18', '18. お問い合わせ'],
          ]
        : [
            ['#sec-1', '1. Access and Use'],
            ['#sec-2', '2. Eligibility'],
            ['#sec-3', '3. Account Registration and Access'],
            ['#sec-4', '4. Payment Terms'],
            ['#sec-5', '5. Ownership and Licenses'],
            ['#sec-6', '6. Third-Party Services and Local Tools'],
            ['#sec-7', '7. Communications'],
            ['#sec-8', '8. Changes to These Terms'],
            ['#sec-9', '9. Termination'],
            ['#sec-10', '10. Changes to the Service'],
            ['#sec-11', '11. Copyright Complaints (DMCA)'],
            ['#sec-12', '12. Privacy'],
            ['#sec-13', '13. Indemnity'],
            ['#sec-14', '14. Disclaimers'],
            ['#sec-15', '15. Limitation of Liability'],
            ['#sec-16', '16. Dispute Resolution'],
            ['#sec-17', '17. Miscellaneous (incl. Export Controls)'],
            ['#sec-18', '18. Contact Us'],
          ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {items.map(([href, label]) => (
          <li key={href}>
            <a
              href={href}
              className="text-orange-600 hover:text-orange-700 underline underline-offset-2"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** =========================
 * 中文版本
 * ========================= */
function TermsZh() {
  return (
    <>
      <DateBlock lang="zh" />
      <TOC lang="zh" />

      <section id="sec-1" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          1. 访问与使用
        </h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          1.1 访问授权
        </h3>
        <p className="text-gray-700 mb-4">
          欢迎，感谢您对 {COMPANY_NAME}（“我们”或“本公司”）的关注。我们开发并提供
          {PRODUCT_NAME}，其是一套面向 Verilog/SystemVerilog（“Verilog/SV”）开发场景的
          AI 编程 IDE 与相关云服务（统称为“服务”），用于协助数字芯片前端与 FPGA 设计
          的编码、重构、解释、测试平台/验证代码生成、文档生成、规则检查与工作流自动化。
        </p>
        <p className="text-gray-700 mb-4">
          在您遵守本条款的前提下，我们授予您一项有限的、非排他的、不可转让的、可撤销的
          权利来访问和使用服务。除本条款明确授予外，我们保留对服务的所有权利。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          1.2 内容（输入与建议）
        </h3>
        <p className="text-gray-700 mb-4">
          您可以向服务提供提示词、代码片段、工程上下文、日志、约束与其它数据（“输入”），
          并基于输入接收代码补全、重写、解释、建议的 RTL/SV/脚本、测试平台、注释、诊断与
          其它输出（统称为“建议”）。输入与建议统称为“内容”。
        </p>
        <p className="text-gray-700 mb-4">
          我们可为以下目的处理内容：提供与维护服务、执行本条款与政策、遵守适用法律、以及保障
          服务安全与防滥用。您声明并保证您对输入拥有提供与授权处理所必需的一切权利、许可与授权，
          且输入不侵犯第三方权利或违反法律法规/保密义务。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          1.3 模型训练（默认不启用）
        </h3>
        <p className="text-gray-700 mb-4">
          除非您在服务中明确选择“允许用于训练/改进模型”或通过企业协议另行约定，否则我们不会将您的内容
          用于训练任何 AI 模型，也不会允许第三方使用您的内容训练 AI 模型。您可在产品设置中管理相关偏好。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          1.4 关于建议的局限性
        </h3>
        <p className="text-gray-700 mb-4">
          您确认建议由机器学习技术自动生成，可能与提供给其他用户的建议相似或相同。建议可能包含错误、
          不完整或具有误导性的信息，且在 Verilog/SV、时序/面积/功耗、CDC/RDC、形式验证、综合与实现、
          约束编写、协议一致性等方面可能表现不佳。您有责任对建议进行独立验证（包括仿真、lint、形式检查、
          综合/实现、板级验证等），并自行承担使用建议的全部风险。
        </p>
        <p className="text-gray-700 mb-4">
          尤其在与安全关键、生命支持、武器、航空航天、汽车功能安全、医疗器械或其它高风险系统相关的设计中，
          您应采用行业标准的审查与验证流程；服务不替代专业工程判断。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.5 使用限制</h3>
        <p className="text-gray-700 mb-4">
          除非且仅在适用法律禁止此类限制的范围内，您不得：
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>对服务进行逆向工程、反编译、解码，或试图获取其源代码/底层结构；</li>
          <li>复制、修改、翻译或基于服务创建衍生作品（除非法律允许或我们书面同意）；</li>
          <li>出租、租赁、出借、出售或以其它方式向第三方提供服务（除非企业授权/转售协议）；</li>
          <li>移除服务中的专有权声明、商标或版权标识；</li>
          <li>
            使用服务或建议来开发、训练与服务具有竞争关系的模型/系统，或从事模型提取、提示注入导致的数据外泄、
            或其它“模型窃取/抽取”攻击；
          </li>
          <li>探测、扫描或尝试渗透、入侵服务；或大规模抓取/爬取/提取服务数据；</li>
          <li>以侵犯第三方知识产权、商业秘密、隐私或违反法律法规的方式使用服务；</li>
          <li>
            向我们发送受特别法律保护的数据（例如受特定行业合规标准保护的数据），除非我们书面同意并提供相应合规能力；
          </li>
          <li>明知而允许任何第三方实施上述行为。</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.6 Beta 服务</h3>
        <p className="text-gray-700 mb-4">
          我们可能提供标注为 beta/试点/早期访问/评估版的功能（“Beta 服务”）。Beta 服务按“现状”与“可用”提供，
          可能不稳定且不提供完整支持；您应避免在生产/关键路径中依赖 Beta 服务，使用风险由您自行承担。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.7 自动执行与本地代理</h3>
        <p className="text-gray-700 mb-4">
          服务可能包含可自动执行命令或调用本地工具链（例如 lint、仿真、综合脚本、版本控制命令等）的功能，
          并在界面中清晰标注。启用/授权此类功能即表示您确认并同意自行承担相关风险，包括系统中断、数据丢失、
          安全漏洞、许可证合规问题以及由错误命令导致的工程破坏。请在受控环境中使用，并做好备份与权限隔离。
        </p>
      </section>

      <section id="sec-2" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 资格</h2>
        <p className="text-gray-700 mb-4">
          您必须已达到您所在司法辖区的法定成年年龄或 18 周岁（以较高者为准）方可使用服务。通过同意本条款，
          您声明并保证：(a) 您符合年龄要求；(b) 您未曾被暂停或移除服务；(c) 您使用服务符合所在地的所有适用法律。
        </p>
      </section>

      <section id="sec-3" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          3. 账户注册与访问
        </h2>
        <p className="text-gray-700 mb-4">
          访问服务的大多数功能需要注册账户。您同意提供真实、准确、完整且不具误导性的注册信息，并保持更新。
          您应对账户与凭据保密承担全部责任，并对您账户下发生的所有活动负责。如您怀疑账户不再安全，请立即联系我们：
          {SUPPORT_EMAIL}。
        </p>
      </section>

      <section id="sec-4" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 付款条款</h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 付费服务</h3>
        <p className="text-gray-700 mb-4">
          服务的部分功能可能需要支付费用。在您支付前，您将有机会查看并接受费用。除法律另有规定外，费用通常不予退还。
          若您通过企业订单/主服务协议（MSA）购买，相关定价与付款以订单或 MSA 为准。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 定价与变更</h3>
        <p className="text-gray-700 mb-4">
          我们可决定并调整服务定价（包括订阅费、按量计费、附加组件等）。如发生重大变更，我们将通过界面提示、邮件或其它合理方式提前通知。
          在变更生效后继续使用服务即表示您同意支付变更后的金额。您需承担与服务相关的税费（以我们净收入为基础的税费除外）。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 支付处理</h3>
        <p className="text-gray-700 mb-4">
          我们可能使用第三方支付处理方（例如 Stripe 或同等服务商）处理付款。您使用支付功能即同意受第三方支付处理方的条款与政策约束。
          我们对第三方支付处理方提供的服务不承担责任或义务。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 订阅服务</h3>
        <p className="text-gray-700 mb-4">
          订阅服务将按周期自动续订，除非您在续订前取消。为避免下一周期扣费，您应在续订前至少 24 小时完成取消（或以界面显示规则为准）。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.5 附加组件与按量计费</h3>
        <p className="text-gray-700 mb-4">
          服务可能提供按量计费能力（例如 AI 请求额度、推理/加速计算、团队席位、私有模型网关等）以及附加组件。附加组件属于服务的一部分并受本条款约束。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.6 逾期账户</h3>
        <p className="text-gray-700 mb-4">
          若账户存在应付未付金额，我们可暂停或终止您对服务（含付费功能）的访问，并可能产生合理的追缴费用。
          若付款方式失效且长期未更新，我们可能在不承担责任的情况下删除账户及与之关联的信息（法律要求保留的除外）。
        </p>
      </section>

      <section id="sec-5" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 所有权与许可</h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 服务</h3>
        <p className="text-gray-700 mb-4">
          我们及许可方拥有并保留对服务及其改进、增强、修改的全部知识产权与权益。本条款不包含任何默示许可。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 反馈</h3>
        <p className="text-gray-700 mb-4">
          若您提交关于服务的意见、建议或改进想法（“反馈”），您授予我们在无需向您支付报酬且不受限制的情况下使用与商业化反馈的权利。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 内容</h3>
        <p className="text-gray-700 mb-4">
          您保留对输入所拥有的全部权利、所有权和权益。对于任何建议，如有，我们在此将我们对该等建议所拥有的全部权利、所有权和权益（如有）转让给您。
          但上述不影响：(a) 我们对服务本身及其模型/提示/系统的权利；(b) 您对输入不具备权利或无权授权的部分；(c) 第三方权利。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4 使用数据</h3>
        <p className="text-gray-700 mb-4">
          我们可在内部收集、分析与处理关于服务使用与交互的技术日志与指标（“使用数据”）用于安全、分析、改进与纠错；并可仅以汇总与/或去标识化形式向第三方披露使用数据。
          使用数据不包括内容本身。
        </p>
      </section>

      <section id="sec-6" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          6. 第三方服务与本地工具
        </h2>
        <p className="text-gray-700 mb-4">
          服务可能集成第三方服务（例如模型提供方、插件市场、版本控制平台、CI 服务等）或调用您本地安装的工具链（例如仿真器、综合/实现工具、lint 工具、脚本解释器等）。
          第三方服务受其自身条款约束；您有责任确保您对第三方软件/EDA 工具具备合法许可并遵守其许可证要求。我们对第三方服务不作任何陈述或保证。
        </p>
      </section>

      <section id="sec-7" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 通信</h2>
        <p className="text-gray-700 mb-4">
          我们可能向您发送与账户、安全、账单、产品更新相关的必要通知；也可能发送促销邮件。您可通过邮件中的退订方式选择不接收促销邮件，但不影响必要通知。
        </p>
      </section>

      <section id="sec-8" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 条款修改</h2>
        <p className="text-gray-700 mb-4">
          我们可能不时修改本条款。若作出重大修改，我们将通过更新本页日期并以合理方式通知。修改发布即生效，您继续使用服务即表示接受修改后的条款。
        </p>
      </section>

      <section id="sec-9" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 终止</h2>
        <p className="text-gray-700 mb-4">
          您可以随时停止使用服务。我们可在任何时间出于合规、安全、反滥用或商业原因暂停或终止服务或您对服务的访问。若我们因您违反本条款而终止，
          您无权获得未使用期间的退款（法律要求的除外）。条款中按其性质应在终止后继续有效的条款（例如使用限制、知识产权、免责声明、责任限制、争议解决等）继续有效。
        </p>
      </section>

      <section id="sec-10" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 服务的修改</h2>
        <p className="text-gray-700 mb-4">
          我们可随时修改或停止全部或部分服务（包括限制某些功能），且无需事先通知。您应根据需要自行备份内容与工程数据。
        </p>
      </section>

      <section id="sec-11" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. 版权投诉（DMCA）</h2>
        <p className="text-gray-700 mb-4">
          若您认为服务中的内容侵犯您的著作权，请发送通知至：{LEGAL_EMAIL}。通知应包含：权利人签名、被侵权作品描述、涉嫌侵权材料位置、您的联系方式、
          善意声明与真实性声明。我们将按适用法律处理，并可在适当情况下终止重复侵权用户的账户。
        </p>
      </section>

      <section id="sec-12" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. 隐私</h2>
        <p className="text-gray-700 mb-4">
          请阅读我们的{' '}
          <Link href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
            隐私政策
          </Link>
          ，其中说明我们如何收集、使用、披露与处理个人数据。使用服务即表示您同意我们按隐私政策处理数据。
        </p>
      </section>

      <section id="sec-13" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. 赔偿</h2>
        <p className="text-gray-700 mb-4">
          在适用法律允许的最大范围内，您将为我们及关联方、董事、高管、员工与代理人进行抗辩并予以赔偿，使其免受因以下情形引起或与之相关的索赔与损失：
          (1) 您未经授权使用或误用服务；(2) 您违反本条款或适用法律；(3) 任何主张称您的输入侵犯第三方权利或违反保密/隐私义务。
        </p>
      </section>

      <section id="sec-14" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. 免责声明</h2>
        <p className="text-gray-700 mb-4">
          服务与建议按“现状”和“可用”提供。在法律允许的最大范围内，我们不作出任何明示或默示担保，包括适销性、特定用途适用性、不侵权、安宁享有等。
          我们不保证服务或建议将不间断、安全、无错误或无有害成分，也不保证问题会被纠正。您不应将建议视为事实依据或最终结论。
        </p>
      </section>

      <section id="sec-15" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. 责任限制</h2>
        <p className="text-gray-700 mb-4">
          在法律允许的最大范围内，我们不对任何间接、附带、特殊、后果性或惩罚性损害承担责任（包括利润损失、商誉受损、业务中断、数据丢失等），
          无论责任理论为何、亦无论我们是否被告知可能发生此类损害。
        </p>
        <p className="text-gray-700 mb-4">
          在法律允许的最大范围内，我们对因本条款、服务或内容引起或与之相关的全部责任总额，不超过您在索赔发生前 12 个月内为服务支付的总费用
          （如无付费，则以 100 美元为上限），以较高者为准（如适用法律另有规定则从其规定）。
        </p>
      </section>

      <section id="sec-16" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. 争议解决</h2>
        <p className="text-gray-700 mb-4">
          如发生争议，双方应先善意协商解决。若协商不成，在法律允许的范围内，双方同意通过具有约束力的仲裁解决，并放弃集体诉讼/集体仲裁/代表诉讼的权利，
          仅以个人名义主张权利。若您所在地法律不允许仲裁或集体诉讼豁免的全部适用，则以适用法律为准。
        </p>
      </section>

      <section id="sec-17" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. 杂项（含出口与贸易管制）</h2>
        <p className="text-gray-700 mb-4">
          本条款（连同隐私政策与通过引用并入的其它政策/订单/协议）构成双方关于服务的完整协议。您不得未经我们书面同意转让本条款；
          我们可在不通知的情况下转让本条款。若条款部分无效，其余部分仍有效。
        </p>
        <p className="text-gray-700 mb-4">
          出口与贸易管制：您必须遵守所有适用的制裁与出口管制法律法规，不得向受限制主体或受禁运地区提供或为其利益使用服务，亦不得将服务用于被禁止的最终用途。
        </p>
      </section>

      <section id="sec-18" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. 联系我们</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>法律事务：{LEGAL_EMAIL}</li>
          <li>客户支持：{SUPPORT_EMAIL}</li>
        </ul>
      </section>
    </>
  );
}

/** =========================
 * English version
 * ========================= */
function TermsEn() {
  return (
    <>
      <DateBlock lang="en" />
      <TOC lang="en" />

      <section id="sec-1" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Access and Use</h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 License to Access</h3>
        <p className="text-gray-700 mb-4">
          Welcome, and thank you for your interest in {COMPANY_NAME} (“we,” “us,” or the “Company”).
          We develop and provide {PRODUCT_NAME}, an AI-assisted IDE and related cloud services focused on
          Verilog/SystemVerilog workflows for digital IC front-end and FPGA development (collectively, the “Service”).
          Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable,
          revocable license to access and use the Service.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 Content (Inputs and Suggestions)</h3>
        <p className="text-gray-700 mb-4">
          You may provide prompts, code, repository context, logs, constraints, and other materials (“Input”),
          and receive code completions, refactors, explanations, generated RTL/SV/scripts/testbenches, diagnostics,
          and other outputs (collectively, “Suggestions”). Input and Suggestions together are “Content.”
        </p>
        <p className="text-gray-700 mb-4">
          We may process Content to provide and maintain the Service, comply with law, enforce our terms/policies,
          and protect the security and integrity of the Service. You represent and warrant that you have all rights
          necessary to provide Input and authorize such processing, and that Input does not violate law or third-party rights
          (including IP, trade secret, privacy, or confidentiality obligations).
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 Model Training (Off by Default)</h3>
        <p className="text-gray-700 mb-4">
          Unless you explicitly opt in within the Service (or agree otherwise under an enterprise agreement),
          we will not use your Content to train any AI model, and we will not permit third parties to train on your Content.
          You can manage related preferences in product settings.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.4 Limitations of Suggestions</h3>
        <p className="text-gray-700 mb-4">
          Suggestions are generated automatically and may be similar to suggestions provided to other users.
          Suggestions may be incorrect, incomplete, or misleading, and may perform poorly on complex tasks requiring
          engineering judgment (e.g., CDC/RDC, formal verification, timing/area/power trade-offs, constraints, protocol compliance).
          You are responsible for independently validating Suggestions (simulation, lint, formal, synthesis/implementation, lab validation, etc.)
          and you assume all risks of use. The Service does not replace professional engineering review.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.5 Restrictions</h3>
        <p className="text-gray-700 mb-4">
          Except to the extent prohibited by applicable law, you may not:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>reverse engineer, decompile, or attempt to derive source code or underlying structure of the Service;</li>
          <li>copy, modify, translate, or create derivative works of the Service without permission;</li>
          <li>rent, lease, sell, sublicense, or otherwise provide the Service to third parties (unless authorized by an enterprise/reseller agreement);</li>
          <li>remove proprietary notices;</li>
          <li>use the Service or Suggestions to develop or train a competing model/system, or engage in model extraction/theft attacks;</li>
          <li>probe, scan, penetrate, scrape, or extract data from the Service at scale;</li>
          <li>use the Service in a manner that violates law or infringes, misappropriates, or otherwise violates third-party rights;</li>
          <li>knowingly allow any third party to do any of the foregoing.</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.6 Beta Features</h3>
        <p className="text-gray-700 mb-4">
          We may offer beta/preview/early access features (“Beta Services”). Beta Services are provided “as is” and “as available,”
          may be unstable, and may not be supported. Avoid relying on Beta Services for production or critical workflows.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.7 Automatic Execution / Local Agents</h3>
        <p className="text-gray-700 mb-4">
          The Service may allow automated command execution or invocation of local toolchains (lint/sim/synth scripts, VCS commands, etc.),
          clearly labeled in the UI. If enabled, you assume all risks including outages, data loss, security issues, licensing/compliance issues,
          and project corruption. Use in controlled environments with backups and least-privilege permissions.
        </p>
      </section>

      <section id="sec-2" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
        <p className="text-gray-700 mb-4">
          You must be at least the age of majority in your jurisdiction or 18 years old (whichever is higher) to use the Service.
          By agreeing, you represent and warrant that you meet this requirement, have not been suspended/removed, and your use complies
          with all applicable laws in your region.
        </p>
      </section>

      <section id="sec-3" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration and Access</h2>
        <p className="text-gray-700 mb-4">
          To access most features you must register an account and provide accurate, complete, non-misleading information and keep it updated.
          You are responsible for safeguarding credentials and all activity under your account. If you believe your account is no longer secure,
          notify us immediately at {SUPPORT_EMAIL}.
        </p>
      </section>

      <section id="sec-4" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment Terms</h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Paid Services</h3>
        <p className="text-gray-700 mb-4">
          Certain features require fees. Before you pay, you will have an opportunity to review and accept the fees.
          Except as required by law, fees are generally non-refundable. Enterprise orders/MSAs control where applicable.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Pricing Changes</h3>
        <p className="text-gray-700 mb-4">
          We may change pricing (subscriptions, usage-based charges, add-ons) with advance notice through the UI, email, or other reasonable means.
          Continued use after the effective date constitutes acceptance. You are responsible for applicable taxes.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Payment Processing</h3>
        <p className="text-gray-700 mb-4">
          We may use third-party payment processors (e.g., Stripe or equivalents). Your payment activity is subject to their terms and policies.
          We are not responsible for the services of payment processors.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 Subscriptions</h3>
        <p className="text-gray-700 mb-4">
          Subscriptions renew automatically unless canceled before renewal. To avoid the next charge, cancel at least 24 hours before renewal
          (or as otherwise displayed in the Service).
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.5 Add-ons and Usage-Based Features</h3>
        <p className="text-gray-700 mb-4">
          We may offer usage-based capabilities (e.g., AI request quotas, compute acceleration, seats, private gateways) and add-ons. Add-ons are part of the Service.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">4.6 Delinquent Accounts</h3>
        <p className="text-gray-700 mb-4">
          We may suspend or terminate access for overdue amounts and may charge reasonable collection-related fees. If your payment method becomes invalid
          and remains unupdated, we may delete the account and associated information without liability (except where retention is required by law).
        </p>
      </section>

      <section id="sec-5" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Ownership and Licenses</h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 The Service</h3>
        <p className="text-gray-700 mb-4">
          We and our licensors own and retain all rights, title, and interest in and to the Service and all improvements, enhancements, and modifications.
          No implied licenses are granted.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Feedback</h3>
        <p className="text-gray-700 mb-4">
          If you provide feedback, you grant us the right to use and commercialize it without restriction or compensation.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Content</h3>
        <p className="text-gray-700 mb-4">
          You retain all rights in Input. To the extent we have any rights in Suggestions, we assign them to you.
          This does not affect our rights in the Service itself, third-party rights, or any portion of Input you do not own or cannot lawfully license.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">5.4 Usage Data</h3>
        <p className="text-gray-700 mb-4">
          We may collect and analyze technical logs and metrics about use of the Service (“Usage Data”) for security, analytics, improvements, and debugging,
          and disclose Usage Data only in aggregated and/or de-identified form. Usage Data does not include Content itself.
        </p>
      </section>

      <section id="sec-6" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Third-Party Services and Local Tools</h2>
        <p className="text-gray-700 mb-4">
          The Service may integrate third-party services (model providers, plugins, source control, CI, etc.) or invoke tools installed on your machine
          (simulators, synthesis/P&R, lint tools, scripting runtimes). Third-party services are governed by their own terms.
          You are responsible for ensuring you have valid licenses and comply with third-party EDA/tool licensing requirements.
          We make no representations or warranties regarding third-party services.
        </p>
      </section>

      <section id="sec-7" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Communications</h2>
        <p className="text-gray-700 mb-4">
          We may send service-related notices (security, billing, updates) and promotional communications. You may opt out of promotional emails,
          but you cannot opt out of essential service notices.
        </p>
      </section>

      <section id="sec-8" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to These Terms</h2>
        <p className="text-gray-700 mb-4">
          We may modify these Terms from time to time. Material changes will be notified by updating the date on this page and by reasonable means.
          Changes are effective upon posting; continued use means acceptance.
        </p>
      </section>

      <section id="sec-9" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
        <p className="text-gray-700 mb-4">
          You may stop using the Service at any time. We may suspend or terminate the Service or your access for compliance, security, abuse prevention,
          or business reasons. If termination is due to your breach, you are not entitled to refunds except as required by law. Provisions that should survive
          termination (restrictions, IP, disclaimers, liability limits, dispute resolution) survive.
        </p>
      </section>

      <section id="sec-10" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to the Service</h2>
        <p className="text-gray-700 mb-4">
          We may modify or discontinue all or part of the Service at any time, including limiting features, without prior notice.
          You should back up your projects and data as needed.
        </p>
      </section>

      <section id="sec-11" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Copyright Complaints (DMCA)</h2>
        <p className="text-gray-700 mb-4">
          If you believe your copyright has been infringed on the Service, contact {LEGAL_EMAIL} with a notice containing:
          signature, description of the copyrighted work, location of the allegedly infringing material, contact information,
          a good faith statement, and an accuracy statement. We may remove or disable content and terminate repeat infringers where appropriate.
        </p>
      </section>

      <section id="sec-12" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Privacy</h2>
        <p className="text-gray-700 mb-4">
          Please review our{' '}
          <Link href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
            Privacy Policy
          </Link>
          , which explains how we collect, use, disclose, and process personal data. By using the Service, you consent to our data practices.
        </p>
      </section>

      <section id="sec-13" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Indemnity</h2>
        <p className="text-gray-700 mb-4">
          To the maximum extent permitted by law, you will defend and indemnify us and our affiliates, directors, officers, employees, and agents
          against any claims, damages, liabilities, losses, and expenses (including reasonable attorneys’ fees) arising out of or related to:
          (1) your unauthorized use or misuse of the Service; (2) your violation of these Terms or applicable law; (3) any claim that your Input
          infringes or violates third-party rights or confidentiality/privacy obligations.
        </p>
      </section>

      <section id="sec-14" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Disclaimers</h2>
        <p className="text-gray-700 mb-4">
          The Service and Suggestions are provided “as is” and “as available.” To the maximum extent permitted by law, we disclaim all warranties,
          express or implied, including merchantability, fitness for a particular purpose, non-infringement, and quiet enjoyment.
          We do not warrant uninterrupted, secure, error-free operation, or that issues will be corrected. Do not treat Suggestions as definitive facts.
        </p>
      </section>

      <section id="sec-15" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Limitation of Liability</h2>
        <p className="text-gray-700 mb-4">
          To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages,
          including lost profits, goodwill, business interruption, or data loss, under any theory of liability.
        </p>
        <p className="text-gray-700 mb-4">
          To the maximum extent permitted by law, our total liability for all claims related to the Service, these Terms, or Content will not exceed
          the total fees you paid to us for the Service in the 12 months preceding the claim (or, if no fees were paid, USD 100), whichever is greater,
          unless applicable law requires otherwise.
        </p>
      </section>

      <section id="sec-16" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Dispute Resolution</h2>
        <p className="text-gray-700 mb-4">
          We encourage informal resolution first. Where permitted by law, disputes will be resolved by binding arbitration and not in court,
          and you waive the right to participate in class actions, class arbitrations, or representative proceedings, proceeding only on an individual basis.
          If your jurisdiction does not allow certain arbitration or waiver terms, applicable law controls.
        </p>
      </section>

      <section id="sec-17" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Miscellaneous (incl. Export Controls)</h2>
        <p className="text-gray-700 mb-4">
          These Terms, together with the Privacy Policy and any incorporated policies/orders, are the entire agreement. You may not assign these Terms without our
          written consent; we may assign them without notice. If any provision is invalid, the remainder remains in effect.
        </p>
        <p className="text-gray-700 mb-4">
          Export and trade controls: you must comply with applicable sanctions and export control laws and may not use, export, re-export, or provide the Service
          to restricted parties or embargoed regions, or for prohibited end uses.
        </p>
      </section>

      <section id="sec-18" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Contact Us</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>Legal: {LEGAL_EMAIL}</li>
          <li>Support: {SUPPORT_EMAIL}</li>
        </ul>
      </section>
    </>
  );
}

/** =========================
 * 日本語版
 * ========================= */
function TermsJa() {
  return (
    <>
      <DateBlock lang="ja" />
      <TOC lang="ja" />

      <section id="sec-1" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. アクセスと利用</h2>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 利用許諾</h3>
        <p className="text-gray-700 mb-4">
          {COMPANY_NAME}（以下「当社」）の {PRODUCT_NAME} は、Verilog/SystemVerilog 開発に特化した AI 支援 IDE と関連クラウド機能（以下総称して「本サービス」）です。
          本規約を遵守することを条件に、当社はお客様に対し、本サービスを利用する限定的・非独占的・譲渡不能・取消可能な権利を付与します。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 コンテンツ（入力と提案）</h3>
        <p className="text-gray-700 mb-4">
          お客様は、プロンプト、コード、リポジトリ文脈、ログ、制約等（「入力」）を提供し、補完、リファクタ、説明、RTL/SV/スクリプト/テストベンチ生成、診断等（「提案」）を受け取る場合があります。
          入力と提案を総称して「コンテンツ」といいます。
        </p>
        <p className="text-gray-700 mb-4">
          当社は、サービス提供、法令遵守、規約・ポリシーの執行、セキュリティ確保のためにコンテンツを処理することがあります。
          お客様は、入力を提供・処理させるために必要な権利を有し、入力が法令または第三者の権利（知財、営業秘密、プライバシー、守秘義務等）を侵害しないことを表明保証します。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 学習利用（既定で無効）</h3>
        <p className="text-gray-700 mb-4">
          本サービス上で明示的に「学習/改善に利用」を選択した場合、または企業契約で別途合意した場合を除き、当社はお客様のコンテンツを AI モデル学習に利用せず、第三者にも学習利用を許可しません。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.4 提案の限界</h3>
        <p className="text-gray-700 mb-4">
          提案は自動生成であり、誤りや不完全さを含む可能性があります。CDC/RDC、形式検証、タイミング/面積/電力、制約、プロトコル整合等の高度な判断を要する作業で不適切な結果となる場合があります。
          お客様は提案を独自に検証（シミュレーション、lint、形式、合成/実装、実機検証等）し、その利用リスクを負担します。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.5 禁止事項</h3>
        <p className="text-gray-700 mb-4">適用法で禁止されない限り、以下を行ってはなりません：</p>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>本サービスのリバースエンジニアリング、逆コンパイル等</li>
          <li>無断での複製・改変・派生物作成</li>
          <li>本サービスの賃貸・販売・再許諾（企業契約等で許可される場合を除く）</li>
          <li>権利表示の削除</li>
          <li>競合するモデル/システムの開発・学習、モデル抽出/窃取攻撃</li>
          <li>侵入、過度なスクレイピング、法令や第三者権利に反する利用</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.6 ベータ機能</h3>
        <p className="text-gray-700 mb-4">
          当社はベータ/プレビュー機能を提供する場合があります。ベータ機能は「現状有姿」「提供可能な範囲」で提供され、安定性やサポートが限定される場合があります。
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">1.7 自動実行/ローカルエージェント</h3>
        <p className="text-gray-700 mb-4">
          本サービスは、コマンド自動実行やローカルツール呼出（lint/シミュレーション/合成スクリプト等）を許可する場合があります。
          有効化した場合の停止、データ損失、セキュリティ、ライセンス遵守等のリスクはお客様が負担します。
        </p>
      </section>

      <section id="sec-2" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 利用資格</h2>
        <p className="text-gray-700 mb-4">
          お客様は、居住地の成人年齢または 18 歳（いずれか高い方）以上である必要があります。
        </p>
      </section>

      <section id="sec-3" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. アカウント登録とアクセス</h2>
        <p className="text-gray-700 mb-4">
          多くの機能の利用にはアカウント登録が必要です。登録情報は正確・完全・最新に保ってください。
          お客様は認証情報の管理とアカウント内の行為に責任を負います。安全性に疑いがある場合は {SUPPORT_EMAIL} までご連絡ください。
        </p>
      </section>

      <section id="sec-4" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 支払条件</h2>
        <p className="text-gray-700 mb-4">
          有料機能が存在する場合があります。法律で要求される場合を除き、料金は原則返金不可です。サブスクリプションは自動更新され、更新前に解約しない限り課金が継続します。
        </p>
      </section>

      <section id="sec-5" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 所有権とライセンス</h2>
        <p className="text-gray-700 mb-4">
          本サービスの知的財産権は当社またはライセンサーに帰属します。入力の権利はお客様に留保され、当社が有する提案に関する権利（ある場合）はお客様に移転します。
        </p>
      </section>

      <section id="sec-6" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 第三者サービスとローカルツール</h2>
        <p className="text-gray-700 mb-4">
          本サービスは第三者サービスやローカルツールチェーンを統合/呼び出す場合があります。第三者の利用条件・ライセンス遵守はお客様の責任です。
        </p>
      </section>

      <section id="sec-7" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. コミュニケーション</h2>
        <p className="text-gray-700 mb-4">
          当社は必要な通知（セキュリティ、請求、更新等）およびプロモーション連絡を送る場合があります。プロモーションは配信停止可能ですが、重要通知は停止できません。
        </p>
      </section>

      <section id="sec-8" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 条項の変更</h2>
        <p className="text-gray-700 mb-4">
          当社は本規約を変更する場合があります。重要な変更は合理的な方法で通知し、掲載時に効力を生じます。継続利用は変更への同意を意味します。
        </p>
      </section>

      <section id="sec-9" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 終了</h2>
        <p className="text-gray-700 mb-4">
          お客様はいつでも利用を中止できます。当社はコンプライアンス、セキュリティ、濫用防止等の理由でアクセス停止/終了する場合があります。
        </p>
      </section>

      <section id="sec-10" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. サービスの変更</h2>
        <p className="text-gray-700 mb-4">
          当社は本サービスの全部または一部を変更・停止する場合があります。必要に応じてデータのバックアップを行ってください。
        </p>
      </section>

      <section id="sec-11" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. 著作権申立て（DMCA）</h2>
        <p className="text-gray-700 mb-4">
          著作権侵害の申し立ては {LEGAL_EMAIL} までご連絡ください。適用法に従い対応します。
        </p>
      </section>

      <section id="sec-12" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. プライバシー</h2>
        <p className="text-gray-700 mb-4">
          当社の{' '}
          <Link href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium">
            プライバシーポリシー
          </Link>
          をご確認ください。
        </p>
      </section>

      <section id="sec-13" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. 補償</h2>
        <p className="text-gray-700 mb-4">
          法令で許される最大限の範囲で、お客様は本サービス利用に起因する第三者からの請求等について当社を防御・補償するものとします。
        </p>
      </section>

      <section id="sec-14" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. 免責</h2>
        <p className="text-gray-700 mb-4">
          本サービスおよび提案は「現状有姿」「提供可能な範囲」で提供され、当社は明示黙示を問わず一切の保証を行いません。
        </p>
      </section>

      <section id="sec-15" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. 責任制限</h2>
        <p className="text-gray-700 mb-4">
          法令で許される最大限の範囲で、当社は間接損害、結果損害、逸失利益等について責任を負いません。
          当社の総責任は、直近 12 か月にお客様が当社へ支払った料金（または 100 米ドル）のいずれか高い方を上限とします（適用法で別段定める場合を除く）。
        </p>
      </section>

      <section id="sec-16" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. 紛争解決</h2>
        <p className="text-gray-700 mb-4">
          まずは誠実に協議することを推奨します。適用法が許す範囲で、紛争は拘束力のある仲裁により個別に解決され、集団訴訟等は放棄されます。
        </p>
      </section>

      <section id="sec-17" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. その他（輸出・貿易管理を含む）</h2>
        <p className="text-gray-700 mb-4">
          本規約は完全合意です。お客様は当社の書面同意なく権利義務を譲渡できません。輸出規制・制裁法令を遵守してください。
        </p>
      </section>

      <section id="sec-18" className="mb-8 scroll-mt-24">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. お問い合わせ</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
          <li>法務：{LEGAL_EMAIL}</li>
          <li>サポート：{SUPPORT_EMAIL}</li>
        </ul>
      </section>
    </>
  );
}

export default function TermsOfServicePage() {
  const { currentLanguage } = useLanguage();

  const backText =
    currentLanguage === 'zh'
      ? '返回首页'
      : currentLanguage === 'ja'
        ? 'ホームに戻る'
        : 'Back to Home';

  const title =
    currentLanguage === 'zh'
      ? '服务条款'
      : currentLanguage === 'ja'
        ? '利用規約'
        : 'Terms of Service';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="mb-8">
          <Link href="/" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
            ← {backText}
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">
          {currentLanguage === 'zh'
            ? `本条款适用于您对 ${COMPANY_NAME} 提供的 ${PRODUCT_NAME} 的访问与使用。`
            : currentLanguage === 'ja'
              ? `本規約は、${COMPANY_NAME} が提供する ${PRODUCT_NAME} の利用に適用されます。`
              : `These Terms govern your access to and use of ${PRODUCT_NAME} provided by ${COMPANY_NAME}.`}
        </p>

        <div className="prose prose-gray max-w-none">
          {currentLanguage === 'zh' ? <TermsZh /> : currentLanguage === 'ja' ? <TermsJa /> : <TermsEn />}
        </div>
      </div>
    </div>
  );
}
