'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Smartphone, Lock, ArrowRight, Loader2, ChevronLeft, Wifi, Sun, Moon, AlertCircle, Download, Router, CircleCheck, ArrowUpRight, Fingerprint } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState(5);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [footerText, setFooterText] = useState('');
  const [brandLoaded, setBrandLoaded] = useState(false);
  const [otpSendFailed, setOtpSendFailed] = useState(false);
  const [userDataForBypass, setUserDataForBypass] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // If already logged in as customer, redirect to customer portal
    const existingToken = localStorage.getItem('customer_token');
    if (existingToken) {
      router.replace('/customer');
      return;
    }

    fetch('/api/public/company')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.company.name) {
          setCompanyName(data.company.name);
        }
        if (data.success && data.company.logo) {
          setCompanyLogo(data.company.logo);
        }
        if (data.success && data.company.footerCustomer) {
          setFooterText(data.company.footerCustomer);
        } else if (data.success && data.company.poweredBy) {
          setFooterText(`Powered by ${data.company.poweredBy}`);
        }
      })
      .catch(err => console.error('Load company name error:', err))
      .finally(() => setBrandLoaded(true));
  }, [router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const checkRes = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const checkData = await checkRes.json();

      if (!checkData.success) {
        setError(checkData.error || 'Nomor tidak terdaftar');
        setLoading(false);
        return;
      }

      if (!checkData.requireOTP) {
        localStorage.setItem('customer_token', checkData.token);
        localStorage.setItem('customer_user', JSON.stringify(checkData.user));
        router.push('/customer');
        return;
      }

      const userPhone = checkData.user?.phone || identifier;
      setUserDataForBypass({ phone: userPhone, user: checkData.user });

      const res = await fetch('/api/customer/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userPhone }),
      });

      const data = await res.json();

      if (data.success) {
        setPhone(userPhone);
        setExpiresIn(data.expiresIn || 5);
        setStep('otp');
        setOtpSendFailed(false);
      } else {
        setError(data.error || 'Gagal mengirim OTP. Layanan WhatsApp mungkin sedang tidak tersedia.');
        setOtpSendFailed(true);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/customer/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode: otp }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('customer_token', data.token);
        localStorage.setItem('customer_user', JSON.stringify(data.user));
        router.push('/customer');
      } else {
        setError(data.error || 'Kode OTP salah');
      }
    } catch (_err: unknown) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError('');
  };

  if (!brandLoaded) {
    return <div className="min-h-dvh bg-slate-50 dark:bg-slate-950" />;
  }

  return (
    <main className="min-h-dvh flex flex-col lg:flex-row-reverse bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* ── Mobile Brand Header (mobile only) ── */}
      <div className="lg:hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 px-6 pt-8 pb-7 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-30px] left-[-30px] w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-300">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">route<span className="text-cyan-300">Connect</span></h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Portal pelanggan</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100/80">
            Kendali layanan internet yang lebih dekat—mulai dari mengenali akun hingga meninjau tagihan.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
            {[
              { number: '01', label: 'Identifikasi' },
              { number: '02', label: 'Verifikasi' },
              { number: '03', label: 'Lanjutkan' },
            ].map((item) => (
              <div key={item.number} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-300">{item.number}</span>
                <span className="text-[10px] font-medium text-[#cbd5e1]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── Account access panel ── */}
      <section className="flex items-start justify-center w-full lg:w-[500px] lg:min-h-dvh bg-slate-50 dark:bg-slate-950 px-5 pt-7 pb-8 sm:px-10 sm:pt-12 lg:pt-14 sm:pb-10 flex-shrink-0 relative">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-all shadow-sm"
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>

        <div className="w-full max-w-[380px] rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-7 hidden items-center gap-2.5 lg:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              <Wifi className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">route<span className="text-cyan-600 dark:text-cyan-400">Connect</span></span>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400">Akun pelanggan</span>
          </div>

          {/* Subtitle */}
          <div className="mb-6">
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {step === 'otp' ? 'Konfirmasi identitas' : 'Buka ruang layanan'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {step === 'otp' ? 'Masukkan kode enam digit yang kami kirim ke WhatsApp Anda.' : 'Isi nomor WhatsApp terdaftar atau ID pelanggan untuk melanjutkan.'}
            </p>
          </div>

          {companyName && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              {companyLogo ? (
                <Image unoptimized src={companyLogo} alt="" width={40} height={40} className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                  <Wifi className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Penyedia koneksi Anda</p>
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{companyName}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center pl-4 text-slate-400 dark:text-slate-500">
                  <Smartphone className="h-5 w-5" />
                </div>
                <input
                  aria-label="Nomor WhatsApp atau ID Pelanggan"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                  placeholder="Contoh: 08123456789"
                  disabled={loading}
                />
              </div>
              <p className="text-xs leading-5 text-slate-400 dark:text-slate-500 -mt-1">
                Gunakan nomor WhatsApp terdaftar atau ID pelanggan 8 digit.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</>
                ) : (
                  <>Masuk<ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {otpSendFailed && userDataForBypass && (
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const bypassRes = await fetch('/api/customer/auth/bypass-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: userDataForBypass.phone }),
                      });
                      const bypassData = await bypassRes.json();
                      if (bypassData.success) {
                        localStorage.setItem('customer_token', bypassData.token);
                        localStorage.setItem('customer_user', JSON.stringify(bypassData.user));
                        router.push('/customer');
                      } else {
                        setError(bypassData.error || 'Login gagal');
                      }
                    } catch {
                      setError('Terjadi kesalahan saat login');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Emergency Bypass (Tanpa OTP)
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-all focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center pl-4 text-slate-400 dark:text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  aria-label="Kode OTP"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-center text-xl font-mono tracking-[0.35em] text-slate-900 outline-none placeholder:text-slate-300 dark:text-white dark:placeholder:text-slate-600"
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-center leading-5 text-slate-500 dark:text-slate-400">
                Kirim ke <strong className="text-slate-700 dark:text-slate-200">{identifier}</strong>
                <br />Kode berlaku {expiresIn} menit. Jangan bagikan kepada siapa pun.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-[2] py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Memverifikasi...</> : 'Verifikasi'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                disabled={loading}
                className="w-full text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:text-cyan-600 transition-colors"
              >
                Kirim Ulang Kode
              </button>
            </form>
          )}

          {/* Register Buttons */}
          {step === 'phone' && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-[0.14em] font-semibold">Pertama kali di sini?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/daftar')}
                  className="py-3 px-3 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                >
                  Daftar Pelanggan
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/agent')}
                  className="py-3 px-3 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                >
                  Daftar Agen
                </button>
              </div>
              <button
                type="button"
                onClick={() => router.push('/evoucher')}
                className="w-full mt-3 py-3 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                Beli Voucher WiFi
              </button>
            </div>
          )}

          {/* App Download */}
          <a
            href="/downloads/salfanet-customer.apk?v=1.1.2-4"
            className="mt-5 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            Unduh Aplikasi Android
          </a>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">{footerText || 'routeConnect · Ruang layanan pelanggan'}</p>
        </div>
      </section>

      {/* ── routeConnect overview ── */}
      <section className="relative hidden min-h-dvh flex-1 items-center overflow-hidden bg-[#07172f] px-10 py-12 lg:flex xl:px-16">
        <div className="pointer-events-none absolute -right-36 -top-36 h-[500px] w-[500px] rounded-full border border-cyan-300/[0.08]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-[340px] w-[340px] rounded-full border border-cyan-300/[0.08]" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/[0.08] blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="mb-12 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-[#f8fafc]">route<span className="text-cyan-300">Connect</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Ruang pelanggan</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#67e8f9]">Koneksi yang terasa dekat</p>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.12] tracking-tight text-[#f8fafc] xl:text-6xl">
              Internet Anda. <span className="text-[#67e8f9]">Dalam satu kendali.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#cbd5e1]">
              Kenali akun, tinjau tagihan, dan lanjutkan urusan layanan tanpa berpindah-pindah tempat.
              {companyName ? ` Disediakan untuk pelanggan ${companyName}.` : ''}
            </p>
          </div>

          <div className="mt-11 grid grid-cols-[minmax(0,1fr)_230px] gap-8 xl:gap-12">
            <div className="relative min-h-[300px] overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-6">
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(148,163,184,0.5)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Peta akses</p>
                  <p className="mt-1 text-sm font-semibold text-[#f8fafc]">Satu akun, beberapa kebutuhan</p>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-semibold text-[#a5f3fc]">
                  routeConnect
                </span>
              </div>

              <div className="relative mx-auto mt-7 h-[190px] max-w-[520px]" aria-label="Ilustrasi alur akun routeConnect">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 190" fill="none" aria-hidden="true">
                  <path d="M260 96 105 44M260 96 415 44M260 96 105 150M260 96 415 150" stroke="url(#route-lines)" strokeWidth="1.5" strokeDasharray="5 6" />
                  <defs>
                    <linearGradient id="route-lines" x1="105" y1="44" x2="415" y2="150" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#22d3ee" stopOpacity=".7" />
                      <stop offset="1" stopColor="#818cf8" stopOpacity=".6" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute left-1/2 top-1/2 flex h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[26px] border border-cyan-300/30 bg-[#0c2545] text-cyan-300 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
                  <Router className="h-7 w-7" />
                  <span className="mt-1 text-[9px] font-semibold tracking-wide text-[#e2e8f0]">AKUN ANDA</span>
                </div>

                <div className="absolute left-[4%] top-[4%] flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1e38]/95 px-3 py-2.5">
                  <Fingerprint className="h-4 w-4 text-cyan-300" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0]">Identitas</span>
                </div>
                <div className="absolute right-[3%] top-[4%] flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1e38]/95 px-3 py-2.5">
                  <ArrowUpRight className="h-4 w-4 text-indigo-300" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0]">Layanan</span>
                </div>
                <div className="absolute bottom-[1%] left-[4%] flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1e38]/95 px-3 py-2.5">
                  <CircleCheck className="h-4 w-4 text-emerald-300" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0]">Tagihan</span>
                </div>
                <div className="absolute bottom-[1%] right-[3%] flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1e38]/95 px-3 py-2.5">
                  <Wifi className="h-4 w-4 text-blue-300" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0]">Koneksi</span>
                </div>
              </div>

              <div className="relative z-10 mt-3 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-[#94a3b8]">
                <CircleCheck className="h-3.5 w-3.5 text-emerald-300" />
                Akses disesuaikan dengan akun pelanggan Anda
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#94a3b8]">Mulai dari sini</p>
              {[
                { number: '01', title: 'Kenali akun', detail: 'Pakai nomor WhatsApp atau ID pelanggan.' },
                { number: '02', title: 'Konfirmasi akses', detail: 'Ikuti verifikasi jika diminta.' },
                { number: '03', title: 'Lanjutkan urusan', detail: 'Masuk ke portal pelanggan routeConnect.' },
              ].map((item, index) => (
                <div key={item.number} className="relative flex gap-4 pb-7 last:pb-0">
                  {index < 2 && <span className="absolute left-[15px] top-9 h-[calc(100%-22px)] w-px bg-gradient-to-b from-cyan-300/40 to-white/10" />}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-[#0b1e38] text-[10px] font-bold text-[#67e8f9]">
                    {item.number}
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-[#f8fafc]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#94a3b8]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-xs text-[#64748b]">routeConnect <span className="px-1.5 text-cyan-300/60">/</span> Portal layanan pelanggan</p>
        </div>
      </section>
    </main>
  );
}
