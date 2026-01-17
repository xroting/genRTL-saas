// 用于检查数据库中jobs表的状态
// 运行: node scripts/check-jobs-status.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJobsStatus() {
  console.log('🔍 检查 jobs 表状态...\n');

  // 1. 统计所有任务
  const { count: totalCount, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ 查询失败:', countError);
    return;
  }

  console.log(`📊 总任务数: ${totalCount}`);

  // 2. 按状态统计
  const { data: statusStats, error: statusError } = await supabase
    .from('jobs')
    .select('status');

  if (!statusError && statusStats) {
    const statusCount = {};
    statusStats.forEach(job => {
      statusCount[job.status] = (statusCount[job.status] || 0) + 1;
    });
    console.log('\n📈 按状态统计:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  }

  // 3. 查询最近10条记录
  const { data: recentJobs, error: recentError } = await supabase
    .from('jobs')
    .select('id, user_id, type, status, result_url, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!recentError && recentJobs) {
    console.log('\n📋 最近10条任务:');
    recentJobs.forEach((job, index) => {
      console.log(`\n${index + 1}. Job ID: ${job.id}`);
      console.log(`   用户ID: ${job.user_id}`);
      console.log(`   类型: ${job.type}`);
      console.log(`   状态: ${job.status}`);
      console.log(`   结果URL: ${job.result_url ? (job.result_url.substring(0, 50) + '...') : '无'}`);
      console.log(`   创建时间: ${job.created_at}`);
    });
  }

  // 4. 查询done状态但没有result_url的任务
  const { data: doneNoUrl, error: doneError } = await supabase
    .from('jobs')
    .select('id, status, result_url, created_at')
    .eq('status', 'done')
    .is('result_url', null);

  if (!doneError) {
    console.log(`\n⚠️  状态为done但没有result_url的任务: ${doneNoUrl?.length || 0} 条`);
    if (doneNoUrl && doneNoUrl.length > 0) {
      doneNoUrl.forEach(job => {
        console.log(`   - Job ID: ${job.id}, 创建时间: ${job.created_at}`);
      });
    }
  }

  // 5. 查询有result_url但状态不是done的任务
  const { data: hasUrlNotDone, error: urlError } = await supabase
    .from('jobs')
    .select('id, status, result_url, created_at')
    .not('result_url', 'is', null)
    .neq('status', 'done');

  if (!urlError) {
    console.log(`\n⚠️  有result_url但状态不是done的任务: ${hasUrlNotDone?.length || 0} 条`);
    if (hasUrlNotDone && hasUrlNotDone.length > 0) {
      hasUrlNotDone.forEach(job => {
        console.log(`   - Job ID: ${job.id}, 状态: ${job.status}, 创建时间: ${job.created_at}`);
      });
    }
  }
}

checkJobsStatus()
  .then(() => {
    console.log('\n✅ 检查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 检查失败:', error);
    process.exit(1);
  });

