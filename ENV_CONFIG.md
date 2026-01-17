# genRTL-SaaS 环境变量配置

## Supabase 配置（新的独立工程）
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Stripe 配置
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Stripe Price IDs (从 Stripe Dashboard 复制)
NEXT_PUBLIC_STRIPE_PRICE_HOBBY=price_xxx_hobby
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_xxx_basic
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_xxx_pro
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_xxx_enterprise
```

## LLM API Keys
```bash
# OpenAI (用于 Plan 任务)
OPENAI_API_KEY=sk-proj-xxx

# Anthropic Claude (用于 Implement/Repair 任务)
ANTHROPIC_API_KEY=sk-ant-xxx
```

## Inngest 配置
```bash
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=signkey-xxx
```

## 管理员配置
```bash
# 管理员邮箱白名单（逗号分隔）
ADMIN_EMAILS=admin@genrtl.com,admin2@genrtl.com
```

## 站点配置
```bash
NEXT_PUBLIC_SITE_URL=https://genrtl.yoursite.com
```

