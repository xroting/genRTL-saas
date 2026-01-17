// CBB (Configurable Building Block) 类型定义
// genRTL-SaaS 的核心资产包系统

/**
 * CBB 包的 manifest.json 结构
 */
export interface CBBManifest {
  id: string;                    // 唯一标识符，如 "cbb_uart_16550"
  version: string;               // 语义化版本，如 "1.2.0"
  name: string;                  // 人类可读名称，如 "UART 16550 Compatible"
  description?: string;          // 详细描述
  tags: string[];                // 标签数组，如 ["UART", "APB", "FIFO"]
  entrypoints: {
    rtl_top: string;             // RTL 顶层模块名
    tb_top: string;              // 测试台顶层模块名
    filelist_rtl: string;        // RTL 文件列表路径
    filelist_tb: string;         // TB 文件列表路径
  };
  compat: {
    sv: string;                  // SystemVerilog 版本，如 "2012"
    simulators: string[];        // 支持的仿真器列表
  };
  price_usd: number;             // 单价（美元）
  sha256: string;                // 包文件的 SHA256 校验和
  author?: string;               // 作者
  license?: string;              // 许可证类型
  created_at?: string;           // 创建时间
  updated_at?: string;           // 更新时间
}

/**
 * CBB 注册表记录（数据库存储）
 */
export interface CBBRegistryRecord {
  id: string;                    // UUID
  cbb_id: string;                // CBB 标识符
  version: string;               // 版本号
  manifest: CBBManifest;         // 完整的 manifest 数据
  storage_path: string;          // 存储路径（如 S3/Supabase Storage）
  file_size: number;             // 文件大小（字节）
  sha256: string;                // SHA256 校验和
  is_active: boolean;            // 是否激活
  is_public: boolean;            // 是否公开可用
  download_count: number;        // 下载次数
  created_at: string;
  updated_at: string;
}

/**
 * CBB Resolve 请求
 */
export interface CBBResolveRequest {
  cbb_requirements: CBBRequirement[];
}

/**
 * CBB 需求项（来自 Plan JSON）
 */
export interface CBBRequirement {
  cbb_id?: string;               // 精确匹配的 CBB ID
  name?: string;                 // 名称模糊匹配
  tags?: string[];               // 标签过滤
  min_version?: string;          // 最小版本
  max_version?: string;          // 最大版本
  simulators?: string[];         // 需要支持的仿真器
}

/**
 * CBB Resolve 响应中的候选项
 */
export interface CBBCandidate {
  cbb_id: string;
  version: string;
  name: string;
  description?: string;
  tags: string[];
  price_usd: number;
  entrypoints: CBBManifest['entrypoints'];
  compat: CBBManifest['compat'];
  is_recommended: boolean;       // 是否为推荐版本
  file_size: number;
}

/**
 * CBB Resolve 响应
 */
export interface CBBResolveResponse {
  success: boolean;
  candidates: CBBCandidate[];
  total_price_usd: number;       // 全部候选项的总价
  errors?: string[];             // 无法解析的需求错误
}

/**
 * CBB Checkout 请求
 */
export interface CBBCheckoutRequest {
  user_id: string;
  workspace_id: string;
  job_id: string;
  items: CBBCheckoutItem[];
  idempotency_key: string;       // 幂等键
}

/**
 * CBB Checkout 项
 */
export interface CBBCheckoutItem {
  cbb_id: string;
  version: string;
}

/**
 * CBB Checkout 响应
 */
export interface CBBCheckoutResponse {
  success: boolean;
  receipt_id: string;
  charged: CBBChargedItem[];
  balances_after: {
    included_usd: number;
    on_demand_usd: number;
  };
  error?: string;
}

/**
 * CBB 已扣费项
 */
export interface CBBChargedItem {
  cbb_id: string;
  version: string;
  bucket: 'included' | 'on_demand';
  price_usd: number;
}

/**
 * CBB 收据记录（数据库存储）
 */
export interface CBBReceipt {
  id: string;                    // UUID (receipt_id)
  user_id: string;
  workspace_id: string;
  job_id: string;
  idempotency_key: string;
  items: CBBChargedItem[];
  total_usd: number;
  included_charged: number;      // 从 included 池扣除的金额
  on_demand_charged: number;     // 从 on_demand 池扣除的金额
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

/**
 * CBB Deliver 请求
 */
export interface CBBDeliverRequest {
  receipt_id: string;
}

/**
 * CBB Deliver 响应中的下载项
 */
export interface CBBDeliverItem {
  cbb_id: string;
  version: string;
  download_url: string;          // 短期有效的签名 URL
  sha256: string;
  file_size: number;
  expires_in: number;            // 过期时间（秒）
  expires_at: string;            // ISO 时间戳
}

/**
 * CBB Deliver 响应
 */
export interface CBBDeliverResponse {
  success: boolean;
  receipt_id: string;
  items: CBBDeliverItem[];
  error?: string;
}

/**
 * Usage Ledger 记录类型
 */
export type UsageLedgerKind = 'llm' | 'cbb';
export type UsageBucket = 'included' | 'on_demand';

/**
 * Usage Ledger 记录
 */
export interface UsageLedgerRecord {
  id: string;
  user_id: string;
  timestamp: string;
  kind: UsageLedgerKind;
  bucket: UsageBucket;
  job_id?: string;
  step_id?: string;
  workspace_id?: string;
  usd_cost: number;

  // LLM 特有字段
  provider?: string;             // openai, anthropic, google
  model?: string;                // gpt-5.1, claude-sonnet, etc.
  input_tokens?: number;
  output_tokens?: number;
  cached_input_tokens?: number;

  // CBB 特有字段
  cbb_id?: string;
  cbb_version?: string;
  cbb_price_usd?: number;
  receipt_id?: string;

  idempotency_key?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Plan Job 类型
 */
export interface PlanJob {
  id: string;
  user_id: string;
  workspace_id: string;
  type: 'plan';
  status: 'queued' | 'processing' | 'done' | 'failed';
  spec: string;                  // 用户输入的规格说明
  constraints?: Record<string, any>; // 工程约束
  result?: PlanResult;           // 生成的 Plan JSON
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Plan 结果（结构化 JSON）
 */
export interface PlanResult {
  modules: PlanModule[];
  cbb_requirements: CBBRequirement[];
  verification_plan: VerificationPlan;
  estimated_tokens?: number;
  estimated_cost_usd?: number;
}

/**
 * Plan 中的模块定义
 */
export interface PlanModule {
  name: string;
  type: 'cbb' | 'custom';        // CBB 模块或自定义模块
  cbb_id?: string;               // 如果是 CBB 模块，指定 ID
  description: string;
  interfaces: ModuleInterface[];
  dependencies?: string[];
}

/**
 * 模块接口定义
 */
export interface ModuleInterface {
  name: string;
  direction: 'input' | 'output' | 'inout';
  width?: number;
  description?: string;
}

/**
 * 验证计划
 */
export interface VerificationPlan {
  testbenches: TestbenchSpec[];
  assertions: AssertionSpec[];
  coverage_points: CoveragePoint[];
}

/**
 * 测试台规格
 */
export interface TestbenchSpec {
  name: string;
  description: string;
  target_modules: string[];
  test_scenarios: string[];
}

/**
 * 断言规格
 */
export interface AssertionSpec {
  name: string;
  type: 'immediate' | 'concurrent';
  condition: string;
  description: string;
}

/**
 * 覆盖点
 */
export interface CoveragePoint {
  name: string;
  type: 'code' | 'functional' | 'toggle';
  description: string;
}

/**
 * Implement Job 类型
 */
export interface ImplementJob {
  id: string;
  user_id: string;
  workspace_id: string;
  type: 'implement';
  status: 'queued' | 'processing' | 'done' | 'failed';
  plan_json: PlanResult;         // 输入的 Plan JSON
  resolved_cbbs: CBBCandidate[]; // 已解析的 CBB manifests
  workspace_policy?: WorkspacePolicy;
  result?: ImplementResult;      // 生成的 patch
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Workspace 策略
 */
export interface WorkspacePolicy {
  readonly_paths: string[];      // 只读路径，如 vendor/cbb
  forbidden_modifications: string[]; // 禁止修改的模式
}

/**
 * Implement 结果
 */
export interface ImplementResult {
  patches: PatchFile[];
  files_created: string[];
  files_modified: string[];
  summary: string;
}

/**
 * Patch 文件
 */
export interface PatchFile {
  path: string;
  operation: 'create' | 'modify' | 'delete';
  content?: string;              // 对于 create
  diff?: string;                 // 对于 modify (unified diff)
}

/**
 * Repair Job 类型
 */
export interface RepairJob {
  id: string;
  user_id: string;
  workspace_id: string;
  type: 'repair';
  status: 'queued' | 'processing' | 'done' | 'failed';
  evidence_bundle: EvidenceBundle;
  workspace_policy?: WorkspacePolicy;
  result?: RepairResult;
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Evidence Bundle（修复证据包）
 */
export interface EvidenceBundle {
  diagnostics: DiagnosticMessage[];
  tool_logs?: string;            // 工具日志摘要
  snippets: CodeSnippet[];       // 错误附近的代码片段
  lockfile_summary?: LockfileSummary;
}

/**
 * 诊断消息
 */
export interface DiagnosticMessage {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column?: number;
  message: string;
  code?: string;                 // 错误代码
}

/**
 * 代码片段
 */
export interface CodeSnippet {
  file: string;
  start_line: number;
  end_line: number;
  content: string;
}

/**
 * Lockfile 摘要
 */
export interface LockfileSummary {
  cbb_versions: Record<string, string>; // cbb_id -> version
  custom_modules: string[];
}

/**
 * Repair 结果
 */
export interface RepairResult {
  patches: PatchFile[];
  files_modified: string[];
  summary: string;
  diagnostics_fixed: number;
  diagnostics_remaining: number;
}

/**
 * Model Router 配置
 */
export interface ModelRouterConfig {
  plan: {
    provider: 'openai';
    model: 'gpt-5.1' | 'gpt-4o';
    max_tokens: number;
    temperature: number;
  };
  implement: {
    provider: 'anthropic';
    model: 'claude-sonnet-4-20250514' | 'claude-3-5-sonnet-latest';
    max_tokens: number;
    temperature: number;
  };
  repair: {
    provider: 'anthropic';
    model: 'claude-sonnet-4-20250514' | 'claude-3-5-sonnet-latest';
    max_tokens: number;
    temperature: number;
  };
}

/**
 * USD Pool（美元池）状态
 */
export interface USDPoolStatus {
  user_id: string;
  team_id: number;
  included_usd_balance: number;  // 订阅内剩余美元
  included_usd_total: number;    // 订阅内总美元
  on_demand_usd: number;         // 超额按量累计
  on_demand_limit?: number;      // 超额限制（用户设置）
  last_reset_at: string;         // 上次重置时间
  next_reset_at: string;         // 下次重置时间
}

/**
 * 订阅计划（扩展版本）
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  price_usd: number;             // 月费
  included_usd: number;          // 每月包含的美元池
  features: {
    plan_enabled: boolean;
    implement_enabled: boolean;
    repair_enabled: boolean;
    cbb_marketplace: boolean;
    on_demand_allowed: boolean;
    priority_support: boolean;
  };
  llm_rates: {
    plan_per_1k_tokens: number;
    implement_per_1k_tokens: number;
    repair_per_1k_tokens: number;
  };
}
