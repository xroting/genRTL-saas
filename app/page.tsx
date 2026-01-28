"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Zap, Shield, Check } from "lucide-react";
import { useAuthStatus } from "@/lib/hooks/use-auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/contexts/language-context";
import Image from "next/image";
import { useMemo } from "react";

export default function HomePage() {
  const { user, loading } = useAuthStatus();
  const { t } = useTranslation();
  
  // Generate a unique session ID for login tracking
  const loginUrl = useMemo(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return `/auth/login?sessionId=${sessionId}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image src="/genRTL.png" alt="genRTL Logo" width={32} height={32} className="rounded" />
              <span className="text-2xl font-bold">genRTL</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                {t('homeNavFeatures')}
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                {t('pricing')}
              </Link>
              <Link href="/docs" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                {t('homeNavDocs')} <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="#changelog" className="text-gray-300 hover:text-white transition-colors">
                {t('homeFooterChangelog')}
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher variant="minimal" theme="dark" />
              {loading ? (
                <div className="w-20 h-9 bg-gray-800 rounded-lg animate-pulse"></div>
              ) : user ? (
                <Link href="/dashboard">
                  <Button className="bg-white text-black hover:bg-gray-200">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href={loginUrl}>
                  <Button className="bg-white text-black hover:bg-gray-200">
                    登录
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t('homeHeroTitle')}<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {t('homeHeroTitleHighlight')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
            {t('homeHeroSubtitle')}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            {user ? (
              <Link href="/generate">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 h-auto">
                  {t('homeStartGenerating')}
                </Button>
              </Link>
            ) : (
              <Link href={loginUrl}>
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 h-auto">
                  {t('homeFreeTrial')}
                </Button>
              </Link>
            )}
          </div>

          {/* Demo/Preview Area */}
          <div className="relative mt-16">
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#1a1a1a] shadow-2xl">
              {/* Mock Editor Interface */}
              <div className="p-6">
                {/* Editor Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm text-gray-500">uart_controller.sv</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">正在生成...</span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="font-mono text-sm text-left">
                  <div className="text-gray-500">// 使用 AI 生成的 UART 控制器</div>
                  <div className="text-purple-400">module <span className="text-blue-400">uart_controller</span> (</div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">input</span> logic clk,
                  </div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">input</span> logic rst_n,
                  </div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">input</span> logic [<span className="text-orange-400">7</span>:<span className="text-orange-400">0</span>] data_in,
                  </div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">output</span> logic tx,
                  </div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">output</span> logic tx_ready
                  </div>
                  <div className="text-purple-400">);</div>
                  <div className="text-gray-500 mt-2 ml-4">// Auto-generated by genRTL AI</div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">logic</span> [<span className="text-orange-400">3</span>:<span className="text-orange-400">0</span>] state;
                  </div>
                  <div className="text-gray-300 ml-4">
                    <span className="text-purple-400">logic</span> [<span className="text-orange-400">15</span>:<span className="text-orange-400">0</span>] baud_counter;
                  </div>
                  <div className="mt-2 ml-4 text-gray-500">
                    <span className="animate-pulse">▊</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Features */}
            <div className="absolute -left-8 top-1/4 bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-xl hidden lg:block">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('syntaxCheckPassed')}</span>
                  </div>
            </div>
            <div className="absolute -right-8 top-1/3 bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 shadow-xl hidden lg:block">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>{t('aiOptimization')}</span>
                  </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            {t('homeFeaturesTitle')}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('homeFeature1Title')}</h3>
              <p className="text-gray-400 mb-4">
                {t('homeFeature1Desc')}
              </p>
              <Link href="#" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                {t('homeLearnMore')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('homeFeature2Title')}</h3>
              <p className="text-gray-400 mb-4">
                {t('homeFeature2Desc')}
              </p>
              <Link href="#" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                {t('homeBrowseLibrary')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('homeFeature3Title')}</h3>
              <p className="text-gray-400 mb-4">
                {t('homeFeature3Desc')}
              </p>
              <Link href="/enterprise" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                {t('homeExploreEnterprise')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            {t('homeTestimonialsTitle')}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8">
              <p className="text-lg text-gray-300 mb-6">
                "{t('homeTestimonial1')}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                <div>
                  <div className="font-semibold">{t('homeTestimonial1Name')}</div>
                  <div className="text-sm text-gray-400">{t('homeTestimonial1Title')}</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8">
              <p className="text-lg text-gray-300 mb-6">
                "{t('homeTestimonial2')}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full"></div>
                <div>
                  <div className="font-semibold">{t('homeTestimonial2Name')}</div>
                  <div className="text-sm text-gray-400">{t('homeTestimonial2Title')}</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8">
              <p className="text-lg text-gray-300 mb-6">
                "{t('homeTestimonial3')}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full"></div>
                <div>
                  <div className="font-semibold">{t('homeTestimonial3Name')}</div>
                  <div className="text-sm text-gray-400">{t('homeTestimonial3Title')}</div>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8">
              <p className="text-lg text-gray-300 mb-6">
                "{t('homeTestimonial4')}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
                <div>
                  <div className="font-semibold">{t('homeTestimonial4Name')}</div>
                  <div className="text-sm text-gray-400">{t('homeTestimonial4Title')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Changelog Section */}
      <section id="changelog" className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">{t('homeChangelogTitle')}</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Version 1 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">2.0</span>
                <span className="text-sm text-gray-500">Jan 28, 2026</span>
              </div>
              <h3 className="font-semibold mb-2">{t('homeChangelog1Title')}</h3>
              <p className="text-sm text-gray-400">{t('homeChangelog1Desc')}</p>
            </div>

            {/* Version 2 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">1.9</span>
                <span className="text-sm text-gray-500">Jan 16, 2026</span>
              </div>
              <h3 className="font-semibold mb-2">{t('homeChangelog2Title')}</h3>
              <p className="text-sm text-gray-400">{t('homeChangelog2Desc')}</p>
            </div>

            {/* Version 3 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">1.8</span>
                <span className="text-sm text-gray-500">Jan 8, 2026</span>
              </div>
              <h3 className="font-semibold mb-3">{t('homeChangelog3Title')}</h3>
              <p className="text-sm text-gray-400">{t('homeChangelog3Desc')}</p>
            </div>

            {/* Version 4 */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold">1.7</span>
                <span className="text-sm text-gray-500">Dec 22, 2025</span>
              </div>
              <h3 className="font-semibold mb-2">{t('homeChangelog4Title')}</h3>
              <p className="text-sm text-gray-400">{t('homeChangelog4Desc')}</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/changelog" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-2">
              {t('homeViewChangelog')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('homeCtaTitle')}</h2>
          <p className="text-xl text-gray-400 mb-8">
            {t('homeCtaSubtitle')}
          </p>
          
          {user ? (
            <Link href="/generate">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 h-auto">
                {t('homeStartGenerating')}
              </Button>
            </Link>
          ) : (
            <Link href={loginUrl}>
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-3 h-auto">
                {t('homeFreeTrial')}
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Column 1 */}
            <div>
              <h3 className="font-semibold mb-4">{t('homeFooterProduct')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">{t('homeFooterFeatures')}</Link></li>
                <li><Link href="/enterprise" className="hover:text-white">{t('homeFooterEnterprise')}</Link></li>
                <li><Link href="/pricing" className="hover:text-white">{t('pricing')}</Link></li>
                <li><Link href="/changelog" className="hover:text-white">{t('homeFooterChangelog')}</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h3 className="font-semibold mb-4">{t('homeFooterResources')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/docs" className="hover:text-white">{t('homeFooterDocs')}</Link></li>
                <li><Link href="/learn" className="hover:text-white">{t('homeFooterLearn')}</Link></li>
                <li><Link href="/community" className="hover:text-white">{t('homeFooterCommunity')}</Link></li>
                <li><Link href="/blog" className="hover:text-white">{t('homeFooterBlog')}</Link></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="font-semibold mb-4">{t('homeFooterCompany')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">{t('homeFooterAbout')}</Link></li>
                <li><Link href="/careers" className="hover:text-white">{t('homeFooterCareers')}</Link></li>
                <li><Link href="/contact" className="hover:text-white">{t('homeFooterContact')}</Link></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h3 className="font-semibold mb-4">{t('homeFooterLegal')}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-white">{t('homeFooterTerms')}</Link></li>
                <li><Link href="/privacy" className="hover:text-white">{t('homeFooterPrivacy')}</Link></li>
                <li><Link href="/security" className="hover:text-white">{t('homeFooterSecurity')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/genRTL.png" alt="genRTL Logo" width={24} height={24} className="rounded" />
              <span className="text-sm text-gray-400">© 2026 genRTL - XROTING TECHNOLOGY LLC</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">🛡 SOC 2 认证</span>
              <LanguageSwitcher variant="minimal" theme="dark" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
