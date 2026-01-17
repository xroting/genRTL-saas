// LLM Prompt 模板
// 用于 Plan、Implement、Repair 任务

import type { PlanResult, EvidenceBundle, CBBCandidate, WorkspacePolicy } from '@/lib/cbb/types';

/**
 * Plan 任务的系统提示词
 */
export const PLAN_SYSTEM_PROMPT = `你是一个专业的 RTL（Register Transfer Level）芯片设计架构师。
你的任务是根据用户提供的规格说明，生成一个结构化的设计计划。

## 输出格式
你必须输出一个严格的 JSON 对象，包含以下字段：

{
  "modules": [
    {
      "name": "模块名称",
      "type": "cbb | custom",  // cbb=使用已有的 CBB 模块，custom=需要新开发
      "cbb_id": "如果是 cbb 类型，指定 CBB ID",
      "description": "模块功能描述",
      "interfaces": [
        {
          "name": "接口名称",
          "direction": "input | output | inout",
          "width": 8,  // 位宽，可选
          "description": "接口描述"
        }
      ],
      "dependencies": ["依赖的其他模块名称"]
    }
  ],
  "cbb_requirements": [
    {
      "cbb_id": "精确的 CBB ID（如果知道）",
      "name": "模糊名称搜索",
      "tags": ["标签1", "标签2"],
      "simulators": ["iverilog", "verilator"]  // 需要支持的仿真器
    }
  ],
  "verification_plan": {
    "testbenches": [
      {
        "name": "测试台名称",
        "description": "测试目标描述",
        "target_modules": ["要测试的模块列表"],
        "test_scenarios": ["测试场景1", "测试场景2"]
      }
    ],
    "assertions": [
      {
        "name": "断言名称",
        "type": "immediate | concurrent",
        "condition": "断言条件表达式",
        "description": "断言描述"
      }
    ],
    "coverage_points": [
      {
        "name": "覆盖点名称",
        "type": "code | functional | toggle",
        "description": "覆盖点描述"
      }
    ]
  }
}

## 设计原则
1. **CBB 优先**：优先使用已有的 CBB 模块，减少定制开发
2. **模块化设计**：将复杂功能分解为独立的模块
3. **接口清晰**：每个模块的接口定义必须完整、明确
4. **可验证性**：每个模块都应有对应的测试计划
5. **依赖管理**：明确标注模块间的依赖关系

## 常见 CBB 类型
- UART (16550, Lite)
- SPI (Master, Slave)
- I2C (Master, Slave)
- AXI (Interconnect, Arbiter)
- APB (Bridge, Slave)
- FIFO (Sync, Async)
- Memory Controller
- Clock Domain Crossing (CDC)
- Reset Controller

请根据用户的规格说明，生成详细的设计计划。`;

/**
 * 生成 Plan 用户提示词
 */
export function generatePlanUserPrompt(params: {
  spec: string;
  constraints?: Record<string, any>;
}): string {
  let prompt = `## 设计规格说明\n\n${params.spec}\n\n`;

  if (params.constraints) {
    prompt += `## 工程约束\n\n`;
    for (const [key, value] of Object.entries(params.constraints)) {
      prompt += `- ${key}: ${JSON.stringify(value)}\n`;
    }
  }

  prompt += `\n请生成完整的设计计划 JSON。`;
  return prompt;
}

/**
 * Implement 任务的系统提示词
 */
export const IMPLEMENT_SYSTEM_PROMPT = `你是一个专业的 RTL（Register Transfer Level）芯片设计工程师。
你的任务是根据设计计划，生成 RTL 代码实现。

## 重要约束
1. **禁止修改 CBB**：你不能修改 vendor/cbb 目录下的任何文件
2. **只生成胶合代码**：你的输出应该是：
   - 顶层模块（Top-level wrapper）
   - 胶合逻辑（Glue logic）
   - 缺失的自定义模块
   - 测试台聚合器（TB aggregator）
3. **使用 CBB 的正确接口**：确保使用 CBB manifest 中定义的接口

## 输出格式
你必须输出一个 JSON 对象，包含以下字段：

{
  "patches": [
    {
      "path": "相对文件路径",
      "operation": "create | modify",
      "content": "文件完整内容（create 时）",
      "diff": "unified diff 格式（modify 时）"
    }
  ],
  "files_created": ["新创建的文件列表"],
  "files_modified": ["修改的文件列表"],
  "summary": "实现总结"
}

## 代码规范
1. 使用 SystemVerilog 2012 标准
2. 每个文件开头添加文件头注释
3. 使用有意义的信号命名（snake_case）
4. 添加必要的代码注释
5. 所有时钟和复位信号使用统一命名（clk, rst_n）

请根据设计计划生成实现代码。`;

/**
 * 生成 Implement 用户提示词
 */
export function generateImplementUserPrompt(params: {
  planJson: PlanResult;
  resolvedCbbs: CBBCandidate[];
  workspacePolicy?: WorkspacePolicy;
}): string {
  let prompt = `## 设计计划\n\n\`\`\`json\n${JSON.stringify(params.planJson, null, 2)}\n\`\`\`\n\n`;

  prompt += `## 已解析的 CBB 模块\n\n`;
  for (const cbb of params.resolvedCbbs) {
    prompt += `### ${cbb.cbb_id} (v${cbb.version})\n`;
    prompt += `- 名称: ${cbb.name}\n`;
    prompt += `- RTL 顶层: ${cbb.entrypoints.rtl_top}\n`;
    prompt += `- TB 顶层: ${cbb.entrypoints.tb_top}\n`;
    prompt += `- 仿真器: ${cbb.compat.simulators.join(', ')}\n\n`;
  }

  if (params.workspacePolicy) {
    prompt += `## 工作区策略\n\n`;
    prompt += `### 只读路径（禁止修改）\n`;
    for (const path of params.workspacePolicy.readonly_paths) {
      prompt += `- ${path}\n`;
    }
    prompt += `\n### 禁止修改的模式\n`;
    for (const pattern of params.workspacePolicy.forbidden_modifications) {
      prompt += `- ${pattern}\n`;
    }
    prompt += '\n';
  }

  prompt += `请生成实现代码的 JSON 输出。`;
  return prompt;
}

/**
 * Repair 任务的系统提示词
 */
export const REPAIR_SYSTEM_PROMPT = `你是一个专业的 RTL（Register Transfer Level）芯片设计调试专家。
你的任务是根据错误诊断信息，生成最小化的修复补丁。

## 重要约束
1. **禁止修改 CBB**：你不能修改 vendor/cbb 目录下的任何文件
2. **最小化修复**：只修复报告的问题，不做其他改动
3. **保持一致性**：确保修复后的代码风格与原代码一致

## 输出格式
你必须输出一个 JSON 对象，包含以下字段：

{
  "patches": [
    {
      "path": "相对文件路径",
      "operation": "modify",
      "diff": "unified diff 格式"
    }
  ],
  "files_modified": ["修改的文件列表"],
  "summary": "修复总结",
  "diagnostics_fixed": 5,  // 修复的诊断数量
  "diagnostics_remaining": 0  // 剩余未修复的诊断数量
}

## 修复策略
1. 首先分析错误原因
2. 确定最小修复范围
3. 验证修复不会引入新问题
4. 如果无法修复，说明原因

请根据诊断信息生成修复补丁。`;

/**
 * 生成 Repair 用户提示词
 */
export function generateRepairUserPrompt(params: {
  evidenceBundle: EvidenceBundle;
  workspacePolicy?: WorkspacePolicy;
}): string {
  const { evidenceBundle } = params;
  let prompt = '';

  // 诊断消息
  prompt += `## 诊断消息\n\n`;
  for (const diag of evidenceBundle.diagnostics) {
    prompt += `### ${diag.severity.toUpperCase()}: ${diag.file}:${diag.line}`;
    if (diag.column) prompt += `:${diag.column}`;
    prompt += `\n`;
    prompt += `${diag.message}\n`;
    if (diag.code) prompt += `错误代码: ${diag.code}\n`;
    prompt += '\n';
  }

  // 工具日志
  if (evidenceBundle.tool_logs) {
    prompt += `## 工具日志\n\n\`\`\`\n${evidenceBundle.tool_logs}\n\`\`\`\n\n`;
  }

  // 代码片段
  prompt += `## 相关代码片段\n\n`;
  for (const snippet of evidenceBundle.snippets) {
    prompt += `### ${snippet.file} (行 ${snippet.start_line}-${snippet.end_line})\n`;
    prompt += `\`\`\`systemverilog\n${snippet.content}\n\`\`\`\n\n`;
  }

  // Lockfile 摘要
  if (evidenceBundle.lockfile_summary) {
    prompt += `## Lockfile 摘要\n\n`;
    prompt += `### CBB 版本\n`;
    for (const [cbbId, version] of Object.entries(evidenceBundle.lockfile_summary.cbb_versions)) {
      prompt += `- ${cbbId}: ${version}\n`;
    }
    prompt += `\n### 自定义模块\n`;
    for (const module of evidenceBundle.lockfile_summary.custom_modules) {
      prompt += `- ${module}\n`;
    }
    prompt += '\n';
  }

  // 工作区策略
  if (params.workspacePolicy) {
    prompt += `## 工作区策略\n\n`;
    prompt += `### 只读路径（禁止修改）\n`;
    for (const path of params.workspacePolicy.readonly_paths) {
      prompt += `- ${path}\n`;
    }
    prompt += '\n';
  }

  prompt += `请生成修复补丁的 JSON 输出。`;
  return prompt;
}

export default {
  PLAN_SYSTEM_PROMPT,
  IMPLEMENT_SYSTEM_PROMPT,
  REPAIR_SYSTEM_PROMPT,
  generatePlanUserPrompt,
  generateImplementUserPrompt,
  generateRepairUserPrompt,
};
