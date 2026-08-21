"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Zap,
  DollarSign,
  Headphones,
  Code,
  LayoutGrid,
  Layers,
  UserPlus,
  Wallet,
  ShoppingCart,
  Menu,
  X,
  TrendingUp,
  Clock,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, ease: "easeOut" as const },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, ease: "easeOut" as const },
  },
};

const features = [
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Orders start processing within minutes. Get your social media boost instantly with our automated system.",
  },
  {
    icon: DollarSign,
    title: "Cheapest Prices",
    description: "Starting from just $0.001 per unit. The most competitive pricing in the SMM panel market.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our dedicated support team is available round the clock to help you with any questions or issues.",
  },
  {
    icon: Code,
    title: "API Access",
    description: "Full REST API access for developers. Integrate our services directly into your own platform.",
  },
  {
    icon: LayoutGrid,
    title: "Child Panels",
    description: "Create and manage your own child panels. Set your own prices and run your reseller business.",
  },
  {
    icon: Layers,
    title: "Mass Orders",
    description: "Upload hundreds of orders at once with our bulk order feature. Perfect for large campaigns.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Register & Login",
    description: "Create your free account in seconds. No verification required to get started.",
  },
  {
    icon: Wallet,
    title: "Add Funds",
    description: "Deposit via multiple payment methods. PayPal, crypto, and more available.",
  },
  {
    icon: ShoppingCart,
    title: "Place Order",
    description: "Choose a service, enter details, and submit. Watch your social media grow!",
  },
];

const platforms = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Telegram",
  "Twitter/X",
  "Twitch",
  "Snapchat",
  "Threads",
  "Pinterest",
  "Reddit",
  "LinkedIn",
];

const stats = [
  { value: "10K+", label: "Orders", icon: TrendingUp },
  { value: "500+", label: "Services", icon: Layers },
  { value: "24/7", label: "Support", icon: Headphones },
  { value: "99.9%", label: "Uptime", icon: Shield },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/60">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="ADNAN SMM Panel"
              width={140}
              height={76}
              priority
              className="h-[38px] w-[70px] sm:h-[50px] sm:w-[92px] md:h-[60px] md:w-[110px] lg:h-[76px] lg:w-[140px] object-contain"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Services
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              API
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="md:hidden border-t border-border/60 bg-white"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                Services
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                API
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                Pricing
              </Link>
              <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    Register
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: "easeOut" as const }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
                  <Zap className="size-4" />
                  #1 Rated SMM Panel
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
                  #1 SMM Panel for{" "}
                  <span className="text-gradient">Social Media Growth</span>
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg">
                  Get the cheapest prices and fastest delivery for all your social
                  media needs. Grow your Instagram, TikTok, YouTube, and more
                  with our premium services trusted by thousands.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button size="lg" className="w-full sm:w-auto" asChild>
                    <Link href="/register">
                      Get Started
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/login">View Services</Link>
                  </Button>
                </div>
              </motion.div>

              {/* Decorative Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" as const }}
                className="hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-200/60 via-violet-200/40 to-fuchsia-200/30 blur-2xl" />
                  <div className="relative rounded-2xl border border-indigo-100 bg-white p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-3 rounded-full bg-red-400" />
                      <div className="size-3 rounded-full bg-amber-400" />
                      <div className="size-3 rounded-full bg-green-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Instagram Followers
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                          $0.50/1K
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-violet-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          TikTok Likes
                        </span>
                        <span className="text-sm font-bold text-violet-600">
                          $0.30/1K
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-fuchsia-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          YouTube Views
                        </span>
                        <span className="text-sm font-bold text-fuchsia-600">
                          $1.20/1K
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Telegram Members
                        </span>
                        <span className="text-sm font-bold text-emerald-600">
                          $0.80/1K
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="size-4" />
                      <span>Live pricing updated just now</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== STATS BAR ===== */}
        <section className="border-y border-border/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, ease: "easeOut" as const }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100">
                    <stat.icon className="size-5 text-indigo-600" />
                  </div>
                  <span className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="text-sm text-slate-500">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== FEATURES GRID ===== */}
        <section className="bg-gradient-to-b from-slate-50/50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
              className="text-center mb-12 lg:mb-16"
            >
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                Why Choose <span className="text-gradient">ADNAN SMM</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-500">
                We provide the best social media marketing services with
                unmatched quality and reliability.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, ease: "easeOut" as const }}
                  className="card-premium group rounded-xl border border-slate-200/80 bg-white p-6 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
              className="text-center mb-12 lg:mb-16"
            >
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                How It <span className="text-gradient">Works</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-500">
                Get started in three simple steps and watch your social media
                presence grow.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid gap-8 md:grid-cols-3 md:gap-6"
            >
              {steps.map((step, idx) => (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, ease: "easeOut" as const }}
                  className="relative"
                >
                  {/* Connector Arrow */}
                  {idx < steps.length - 1 && (
                    <div className="absolute top-12 -right-4 hidden md:block z-10">
                      <ArrowRight className="size-6 text-indigo-300" />
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
                        <step.icon className="size-7" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600 border border-indigo-200 shadow-sm">
                        {idx + 1}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== PLATFORMS ===== */}
        <section className="bg-gradient-to-b from-slate-50/50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut" as const }}
              className="text-center mb-10 lg:mb-12"
            >
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                Supported <span className="text-gradient">Platforms</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-500">
                We support all major social media platforms with a wide range
                of services for each.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-3"
            >
              {platforms.map((platform) => (
                <motion.span
                  key={platform}
                  variants={fadeInUp}
                  transition={{ duration: 0.4, ease: "easeOut" as const }}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors"
                >
                  {platform}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/80 via-violet-50/60 to-fuchsia-50/40" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" as const }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                Ready to <span className="text-gradient">Grow</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-500">
                Join thousands of satisfied customers and take your social media
                presence to the next level today.
              </p>
              <div className="mt-8">
                <Button size="lg" className="text-base px-8" asChild>
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border/60 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Image
                src="/logo.png"
                alt="ADNAN SMM Panel"
                width={120}
                height={65}
                className="h-[40px] w-[74px] sm:h-[50px] sm:w-[92px] md:h-[60px] md:w-[110px] object-contain"
              />
              <p className="mt-4 max-w-xs text-sm text-slate-500">
                The #1 SMM panel for social media growth. Trusted by thousands
                worldwide.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-900">
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    New Order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-900">
                Services
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    TikTok
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    YouTube
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-slate-900">
                Support
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border/60 pt-6">
            <p className="text-center text-sm text-slate-400">
              &copy; 2026 ADNAN SMM Panel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
