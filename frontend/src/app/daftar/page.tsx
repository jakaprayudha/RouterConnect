'use client';

import { useEffect, useState } from 'react';
import { useToast, CyberToastProvider } from '@/components/cyberpunk/CyberToast';
import { UserPlus, Loader2, Wifi, CheckCircle, MapPin, Phone, Mail, Home, Package, FileText, Gift, CreditCard, Camera, Map, ShieldCheck, ArrowRight, Router, Zap } from 'lucide-react';
import MapPicker from '@/components/MapPicker';
import { CameraPhotoInput } from '@/components/CameraPhotoInput';

export const dynamic = 'force-dynamic';

interface Profile {
  id: string;
  name: string;
  price: number;
  downloadSpeed: number;
  uploadSpeed: number;
  description: string | null;
}

interface Area {
  id: string;
  name: string;
}

function DaftarPageInner() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    areaId: '',
    profileId: '',
    notes: '',
    referralCode: '',
    idCardNumber: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [idCardPhoto, setIdCardPhoto] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadCompanyName();
    loadProfiles();
    loadAreas();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setFormData(prev => ({ ...prev, referralCode: ref.toUpperCase() }));
  }, []);

  const loadCompanyName = async () => {
    try {
      const res = await fetch('/api/public/company');
      const data = await res.json();
      if (data.success && data.company.name) setCompanyName(data.company.name);
    } catch (error) { console.error('Load company error:', error); }
  };

  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/public/profiles');
      const data = await res.json();
      setProfiles(data.profiles || []);
    } catch (error) { console.error('Failed to load profiles:', error); }
    finally { setLoading(false); }
  };

  const loadAreas = async () => {
    try {
      const res = await fetch('/api/public/areas');
      const data = await res.json();
      setAreas(data.areas || []);
    } catch (error) { console.error('Failed to load areas:', error); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address || !formData.profileId) {
      addToast({ type: 'error', title: 'Form Tidak Lengkap', description: 'Mohon lengkapi semua field yang wajib diisi' });
      return;
    }
    if (!formData.idCardNumber || formData.idCardNumber.trim().length < 16) {
      addToast({ type: 'error', title: 'Nomor KTP Wajib', description: 'Mohon masukkan nomor KTP (16 digit)' });
      return;
    }
    if (!idCardPhoto) {
      addToast({ type: 'error', title: 'Foto KTP Wajib', description: 'Mohon upload foto KTP Anda' });
      return;
    }
    if (formData.latitude === null || formData.longitude === null) {
      addToast({ type: 'error', title: 'Lokasi Diperlukan', description: 'Mohon pilih lokasi GPS Anda di peta' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, idCardPhoto }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        addToast({ type: 'error', title: 'Gagal', description: data.error || 'Gagal mengirim pendaftaran' });
      }
    } catch (_error) {
      addToast({ type: 'error', title: 'Error', description: 'Gagal mengirim pendaftaran' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProfile = profiles.find((p) => p.id === formData.profileId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          Menyiapkan formulir routeConnect...
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="relative z-10 w-full max-w-md rounded-[28px] border border-emerald-200 bg-white p-8 text-center shadow-xl dark:border-emerald-900/50 dark:bg-slate-900">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle className="h-8 w-8" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">routeConnect · Permohonan diterima</p>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Langkah awal selesai
          </h2>
          <p className="mb-6 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Terima kasih, data Anda sudah kami terima. Tim {companyName || 'layanan pelanggan'} akan meninjau detail dan menghubungi Anda melalui WhatsApp.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({ name: '', phone: '', email: '', address: '', areaId: '', profileId: '', notes: '', referralCode: '', idCardNumber: '', latitude: null, longitude: null });
              setIdCardPhoto('');
            }}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:from-cyan-500 hover:to-blue-500"
          >
            Buat permohonan lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950 relative lg:flex lg:flex-row-reverse">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
        <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"></div>
      </div>

      <section className="relative z-10 w-full px-4 pb-10 pt-7 sm:px-8 lg:w-[min(760px,58%)] lg:px-10 lg:py-12 xl:px-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-[#ffffff] shadow-lg shadow-blue-500/20">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">route<span className="text-cyan-600 dark:text-cyan-400">Connect</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Pendaftaran pelanggan</p>
            </div>
          </div>

        {/* Form Card */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Mulai berlangganan</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Kenalan dengan koneksi baru</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Lengkapi beberapa detail agar tim {companyName || 'kami'} dapat meninjau ketersediaan layanan di lokasi Anda.
              </p>
            </div>
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 sm:flex">
              <UserPlus className="h-5 w-5" />
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Info Section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <p className="col-span-full flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-50 text-[10px] text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">01</span>
                Data kontak
              </p>

              {/* Name */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Nama Lengkap <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap Anda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Nomor WhatsApp <span className="text-pink-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  required
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">Untuk komunikasi</p>
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@example.com (opsional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Home className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Alamat Lengkap <span className="text-pink-500">*</span>
                </label>
                <textarea
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  rows={2}
                  required
                />
              </div>

              {/* Area */}
              {areas.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                    <Map className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                    Area / Zona Layanan
                  </label>
                  <select
                    value={formData.areaId}
                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Pilih area layanan (opsional) --</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Pilih area jika tersedia untuk mempercepat proses</p>
                </div>
              )}

              {/* GPS Location */}
              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Lokasi GPS <span className="text-pink-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Auto GPS Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!navigator.geolocation) {
                        addToast({ type: 'error', title: 'GPS Tidak Didukung', description: 'Browser Anda tidak mendukung GPS' });
                          return;
                        }

                        setSubmitting(true);
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setFormData({
                              ...formData,
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude,
                            });
                            addToast({ type: 'success', title: 'Berhasil!', description: 'Lokasi GPS berhasil didapatkan' });
                            setSubmitting(false);
                          },
                          (error) => {
                            let errorMsg = 'Gagal mendapatkan lokasi GPS';
                            if (error.code === 1) errorMsg = 'Akses lokasi ditolak. Mohon aktifkan izin lokasi di browser Anda.';
                            else if (error.code === 2) errorMsg = 'Lokasi tidak tersedia';
                            else if (error.code === 3) errorMsg = 'Timeout mendapatkan lokasi';
                            addToast({ type: 'error', title: 'GPS Error', description: errorMsg });
                            setSubmitting(false);
                          },
                          {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0,
                          }
                        );
                      }}
                      disabled={submitting}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2.5 text-xs font-bold text-[#ffffff] transition-all hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
                    >
                      {submitting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Mengambil...</>
                      ) : (
                        <><MapPin className="w-3.5 h-3.5" />Otomatis</>
                      )}
                    </button>

                    {/* Manual GPS Button */}
                    <button
                      type="button"
                      onClick={() => setMapPickerOpen(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/30"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Manual
                    </button>
                  </div>

                  {formData.latitude !== null && formData.longitude !== null && (
                    <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
                      <p className="text-xs text-green-500 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Lokasi GPS Tersimpan
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-cyan-700 dark:text-cyan-300">
                        Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                  Pilih "Otomatis" untuk GPS real-time atau "Manual" untuk pilih di peta
                </p>
              </div>
            </div>

            {/* Package Selection Section */}
            <div className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">02</span>
                Pilih koneksi
              </p>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Paket Internet <span className="text-pink-500">*</span>
                </label>
                <select
                  value={formData.profileId}
                  onChange={(e) => setFormData({ ...formData, profileId: e.target.value })}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  <option value="">Pilih paket internet</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} - {formatCurrency(profile.price)}/bln
                    </option>
                  ))}
                </select>
              </div>

              {selectedProfile && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-900/50 dark:bg-cyan-950/30">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-300">Ringkasan paket</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/70">Paket:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedProfile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/70">Harga:</span>
                      <span className="font-bold text-green-500 text-base">{formatCurrency(selectedProfile.price)}/bln</span>
                    </div>
                    {selectedProfile.description && (
                      <p className="pt-2 border-t border-border text-muted-foreground/80 text-xs">{selectedProfile.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ID Card Section */}
            <div className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">03</span>
                Verifikasi pemohon
              </p>

              {/* KTP Number */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Nomor KTP <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="16 digit nomor KTP"
                  value={formData.idCardNumber}
                  onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  maxLength={16}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm tracking-widest text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              {/* KTP Photo */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  Foto KTP <span className="text-pink-500">*</span>
                </label>
                <CameraPhotoInput
                  photoUrl={idCardPhoto}
                  onRemove={() => setIdCardPhoto('')}
                  uploading={uploadingPhoto}
                  onUploadFile={async (file) => {
                    setUploadingPhoto(true);
                    try {
                      const fd = new FormData();
                      fd.append('file', file);
                      const res = await fetch('/api/public/upload-registration', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (data.success) {
                        setIdCardPhoto(data.url);
                        return data.url;
                      }
                      addToast({ type: 'error', title: 'Upload Gagal', description: data.error || 'Gagal upload foto KTP' });
                      return null;
                    } catch {
                      addToast({ type: 'error', title: 'Upload Gagal', description: 'Gagal upload foto KTP' });
                      return null;
                    } finally {
                      setUploadingPhoto(false);
                    }
                  }}
                  onGpsCapture={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                  theme="light"
                  hint="JPG/PNG/WebP, maks. 3MB"
                  previewClassName="h-32"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                Catatan (Opsional)
              </label>
              <textarea
                placeholder="Catatan atau permintaan khusus"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                rows={2}
              />
            </div>

            {/* Referral Code */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                <Gift className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                Kode Referral (Opsional)
              </label>
              <input
                type="text"
                placeholder="Masukkan kode referral (jika ada)"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                maxLength={10}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm uppercase tracking-widest text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              {formData.referralCode && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> Kode referral akan ikut diproses bersama permohonan Anda.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3.5 text-sm font-bold text-[#ffffff] shadow-lg shadow-blue-600/20 transition-all hover:from-cyan-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</>
              ) : (
                <><UserPlus className="w-4 h-4" />Kirim Pendaftaran</>
              )}
            </button>

            <p className="text-[10px] text-center text-muted-foreground/60">
              Dengan mendaftar, Anda menyetujui syarat dan ketentuan layanan
            </p>
          </form>
        </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
            Informasi pribadi Anda digunakan untuk memproses permohonan pemasangan.
          </p>
        </div>
      </section>

      <aside className="sticky top-0 hidden h-dvh min-h-dvh w-[42%] self-start flex-col justify-between overflow-hidden bg-[#071a2b] px-10 py-10 text-[#f8fafc] lg:flex xl:px-14 xl:py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-900/40">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight">route<span className="text-cyan-300">Connect</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Internet, lebih dekat</p>
            </div>
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Mulai dari sini</p>
          <h2 className="max-w-lg text-3xl font-bold leading-tight xl:text-4xl">Kami bantu temukan koneksi yang pas untuk rumah Anda.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#cbd5e1]">
            Kirim detail lokasi dan pilihan paket. Tim layanan akan mengecek jangkauan sebelum menghubungi Anda untuk langkah berikutnya.
          </p>

          <div className="mt-7 space-y-3">
            {[
              { icon: MapPin, title: 'Cek lokasi', description: 'Bagikan alamat dan titik pemasangan.' },
              { icon: Router, title: 'Pilih paket', description: 'Bandingkan pilihan yang tersedia.' },
              { icon: Zap, title: 'Tunggu konfirmasi', description: 'Tim kami akan menghubungi Anda.' },
            ].map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-[#cbd5e1]">{description}</p>
                </div>
                {index < 2 && <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-200">Pilihan paket tersedia</h3>
          </div>
          {profiles.length ? (
            <div className="space-y-3">
              {profiles.slice(0, 3).map((profile) => (
                <div key={profile.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{profile.name}</p>
                    <p className="text-xs text-slate-400">{profile.downloadSpeed} Mbps</p>
                  </div>
                  <p className="shrink-0 font-bold text-cyan-200">{formatCurrency(profile.price)}<span className="font-normal text-slate-400">/bln</span></p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-[#cbd5e1]">Paket akan ditampilkan setelah pilihan layanan tersedia untuk area Anda.</p>
          )}
          <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-slate-400">
            Harga dan jangkauan akan dikonfirmasi kembali oleh tim layanan sebelum pemasangan.
          </p>
        </div>
      </aside>

      <MapPicker
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSelect={(lat, lng) => {
          setFormData({ ...formData, latitude: lat, longitude: lng });
          setMapPickerOpen(false);
        }}
        initialLat={formData.latitude || undefined}
        initialLng={formData.longitude || undefined}
      />
    </main>
  );
}

export default function DaftarPage() {
  return (
    <CyberToastProvider>
      <DaftarPageInner />
    </CyberToastProvider>
  );
}
