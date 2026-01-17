// CBB Registry 管理器
// 管理 CBB 资产包的注册、查询、版本控制

import { createSupabaseServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type {
  CBBRegistryRecord,
  CBBManifest,
  CBBRequirement,
  CBBCandidate,
  CBBResolveRequest,
  CBBResolveResponse,
} from './types';

/**
 * 创建 Service Role Supabase 客户端（绕过 RLS）
 */
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * 比较语义化版本
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

export class CBBRegistry {
  /**
   * 注册新的 CBB 包
   */
  static async register(params: {
    manifest: CBBManifest;
    storagePath: string;
    fileSize: number;
    isPublic?: boolean;
  }): Promise<CBBRegistryRecord | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('cbb_registry')
      .insert({
        cbb_id: params.manifest.id,
        version: params.manifest.version,
        manifest: params.manifest,
        storage_path: params.storagePath,
        file_size: params.fileSize,
        sha256: params.manifest.sha256,
        is_active: true,
        is_public: params.isPublic ?? true,
        download_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to register CBB:', error);
      return null;
    }

    return data as CBBRegistryRecord;
  }

  /**
   * 按 ID 和版本获取 CBB
   */
  static async getByIdAndVersion(
    cbbId: string,
    version: string
  ): Promise<CBBRegistryRecord | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('cbb_registry')
      .select('*')
      .eq('cbb_id', cbbId)
      .eq('version', version)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as CBBRegistryRecord;
  }

  /**
   * 获取 CBB 的最新版本
   */
  static async getLatestVersion(cbbId: string): Promise<CBBRegistryRecord | null> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('cbb_registry')
      .select('*')
      .eq('cbb_id', cbbId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data as CBBRegistryRecord;
  }

  /**
   * 获取 CBB 的所有版本
   */
  static async getAllVersions(cbbId: string): Promise<CBBRegistryRecord[]> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('cbb_registry')
      .select('*')
      .eq('cbb_id', cbbId)
      .eq('is_active', true)
      .order('version', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as CBBRegistryRecord[];
  }

  /**
   * 搜索 CBB（按标签、名称）
   */
  static async search(params: {
    query?: string;
    tags?: string[];
    simulators?: string[];
    limit?: number;
  }): Promise<CBBRegistryRecord[]> {
    const supabase = createServiceClient();

    let queryBuilder = supabase
      .from('cbb_registry')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true);

    // 名称模糊搜索
    if (params.query) {
      queryBuilder = queryBuilder.or(
        `manifest->>name.ilike.%${params.query}%,manifest->>description.ilike.%${params.query}%,cbb_id.ilike.%${params.query}%`
      );
    }

    // 标签过滤（使用 JSONB 包含查询）
    if (params.tags && params.tags.length > 0) {
      // Supabase 对 JSONB 数组的查询需要特殊处理
      for (const tag of params.tags) {
        queryBuilder = queryBuilder.contains('manifest->tags', JSON.stringify([tag]));
      }
    }

    // 仿真器过滤
    if (params.simulators && params.simulators.length > 0) {
      for (const sim of params.simulators) {
        queryBuilder = queryBuilder.contains('manifest->compat->simulators', JSON.stringify([sim]));
      }
    }

    queryBuilder = queryBuilder
      .order('download_count', { ascending: false })
      .limit(params.limit || 50);

    const { data, error } = await queryBuilder;

    if (error || !data) {
      console.error('CBB search error:', error);
      return [];
    }

    return data as CBBRegistryRecord[];
  }

  /**
   * 解析 CBB 需求列表，返回候选项
   */
  static async resolve(request: CBBResolveRequest): Promise<CBBResolveResponse> {
    const candidates: CBBCandidate[] = [];
    const errors: string[] = [];
    let totalPrice = 0;

    for (const requirement of request.cbb_requirements) {
      try {
        const resolved = await this.resolveRequirement(requirement);
        if (resolved) {
          candidates.push(resolved);
          totalPrice += resolved.price_usd;
        } else {
          errors.push(
            `无法找到匹配的 CBB: ${requirement.cbb_id || requirement.name || JSON.stringify(requirement.tags)}`
          );
        }
      } catch (err) {
        errors.push(`解析 CBB 需求失败: ${err}`);
      }
    }

    return {
      success: errors.length === 0,
      candidates,
      total_price_usd: totalPrice,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 解析单个 CBB 需求
   */
  private static async resolveRequirement(
    requirement: CBBRequirement
  ): Promise<CBBCandidate | null> {
    let records: CBBRegistryRecord[] = [];

    // 精确匹配 CBB ID
    if (requirement.cbb_id) {
      if (requirement.min_version || requirement.max_version) {
        // 获取所有版本，然后过滤
        records = await this.getAllVersions(requirement.cbb_id);
        records = records.filter((r) => {
          if (requirement.min_version && compareVersions(r.version, requirement.min_version) < 0) {
            return false;
          }
          if (requirement.max_version && compareVersions(r.version, requirement.max_version) > 0) {
            return false;
          }
          return true;
        });
      } else {
        // 获取最新版本
        const latest = await this.getLatestVersion(requirement.cbb_id);
        if (latest) {
          records = [latest];
        }
      }
    } else {
      // 按标签或名称搜索
      records = await this.search({
        query: requirement.name,
        tags: requirement.tags,
        simulators: requirement.simulators,
        limit: 10,
      });
    }

    if (records.length === 0) {
      return null;
    }

    // 按版本排序，选择最新的
    records.sort((a, b) => compareVersions(b.version, a.version));
    const best = records[0];
    const manifest = best.manifest as CBBManifest;

    return {
      cbb_id: best.cbb_id,
      version: best.version,
      name: manifest.name,
      description: manifest.description,
      tags: manifest.tags,
      price_usd: manifest.price_usd,
      entrypoints: manifest.entrypoints,
      compat: manifest.compat,
      is_recommended: true,
      file_size: best.file_size,
    };
  }

  /**
   * 增加下载计数
   */
  static async incrementDownloadCount(cbbId: string, version: string): Promise<void> {
    const supabase = createServiceClient();

    await supabase.rpc('increment_cbb_download_count', {
      p_cbb_id: cbbId,
      p_version: version,
    });
  }

  /**
   * 停用 CBB 版本
   */
  static async deactivate(cbbId: string, version: string): Promise<boolean> {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('cbb_registry')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('cbb_id', cbbId)
      .eq('version', version);

    return !error;
  }

  /**
   * 获取热门 CBB 列表
   */
  static async getPopular(limit: number = 20): Promise<CBBRegistryRecord[]> {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('cbb_registry')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .order('download_count', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as CBBRegistryRecord[];
  }

  /**
   * 批量获取 CBB 信息
   */
  static async getBatch(
    items: Array<{ cbb_id: string; version: string }>
  ): Promise<Map<string, CBBRegistryRecord>> {
    const supabase = createServiceClient();
    const result = new Map<string, CBBRegistryRecord>();

    if (items.length === 0) {
      return result;
    }

    // 构建查询条件
    const conditions = items.map((item) =>
      `(cbb_id.eq.${item.cbb_id},version.eq.${item.version})`
    );

    const { data, error } = await supabase
      .from('cbb_registry')
      .select('*')
      .eq('is_active', true)
      .or(conditions.join(','));

    if (error || !data) {
      console.error('Failed to batch get CBBs:', error);
      return result;
    }

    for (const record of data) {
      const key = `${record.cbb_id}@${record.version}`;
      result.set(key, record as CBBRegistryRecord);
    }

    return result;
  }
}

export default CBBRegistry;
