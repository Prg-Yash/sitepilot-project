'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Loader2, Check, X, Palette, Type, Globe, Image as ImageIcon, CreditCard, ShieldCheck, Key, RefreshCw, CheckCircle2, AlertTriangle, Unlink } from 'lucide-react';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
  'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Quicksand',
  'Karla', 'Cabin', 'Barlow', 'Crimson Text', 'Bitter', 'Arimo', 'Titillium Web',
  'DM Sans', 'Manrope', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit', 'Lexend'
].sort();

export default function SiteSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { tenantId, siteId } = params;
  const faviconInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [site, setSite] = useState(null);
  const [brandKit, setBrandKit] = useState(null);

  // Site title (for the site name)
  const [siteTitle, setSiteTitle] = useState('');
  const [favicon, setFavicon] = useState(''); // S3 key
  const [faviconDisplayUrl, setFaviconDisplayUrl] = useState(''); // presigned URL for display

  // Payment Gateway (Razorpay)
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [keyIdInput, setKeyIdInput] = useState('');
  const [keySecretInput, setKeySecretInput] = useState('');
  const [merchantNameInput, setMerchantNameInput] = useState('');
  const [verifyingGateway, setVerifyingGateway] = useState(false);
  const [gatewayMsg, setGatewayMsg] = useState({ type: '', text: '' });

  // Global Colors
  const [colorMode, setColorMode] = useState('brandkit'); // 'brandkit' or 'custom'
  const [globalColors, setGlobalColors] = useState({
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    tertiary: '#EC4899'
  });

  // Global Typography
  const [fontMode, setFontMode] = useState('brandkit'); // 'brandkit' or 'custom'
  const [globalFonts, setGlobalFonts] = useState({
    heading: 'Poppins',
    body: 'Inter'
  });

  // Load data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [siteRes, brandRes] = await Promise.all([
        fetch(`/api/sites/${siteId}`),
        fetch(`/api/tenants/${tenantId}/brand-kit`)
      ]);

      if (siteRes.ok) {
        const { site: siteData } = await siteRes.json();
        setSite(siteData);

        // Populate existing settings
        const gs = siteData.globalSettings || {};
        setSiteTitle(gs.siteTitle || siteData.name || '');
        const savedFavicon = siteData.favicon || '';
        setFavicon(savedFavicon);
        
        // Resolve S3 key to presigned URL for display
        if (savedFavicon && !savedFavicon.startsWith('http')) {
          try {
            const mediaRes = await fetch(`/api/tenants/${tenantId}/media`);
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              const match = mediaData.media?.find(m => m.originalKey === savedFavicon || m.url?.includes(savedFavicon));
              if (match) setFaviconDisplayUrl(match.url);
            }
          } catch (e) { /* ignore */ }
        } else if (savedFavicon) {
          setFaviconDisplayUrl(savedFavicon);
        }

        // Colors
        if (gs.colorMode) setColorMode(gs.colorMode);
        if (gs.globalColors) setGlobalColors(gs.globalColors);

        // Fonts
        if (gs.fontMode) setFontMode(gs.fontMode);
        if (gs.globalFonts) setGlobalFonts(gs.globalFonts);
      }

      if (brandRes.ok) {
        const data = await brandRes.json();
        if (data.brandKit && Object.keys(data.brandKit).length > 0) {
          setBrandKit(data.brandKit);
          // If color mode is brandkit, sync from brand kit
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [siteId, tenantId]);

  // Load gateway status
  const fetchGateway = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/payment-gateway`);
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus(data);
        if (data.merchantName) setMerchantNameInput(data.merchantName);
      }
    } catch (e) {
      console.warn('Failed to load gateway:', e);
    }
  }, [siteId]);

  useEffect(() => {
    fetchData();
    fetchGateway();
  }, [fetchData, fetchGateway]);

  // Connect & Verify Razorpay
  const handleConnectRazorpay = async () => {
    if (!keyIdInput.trim() || !keySecretInput.trim()) {
      setGatewayMsg({ type: 'error', text: 'Both Key ID and Key Secret are required.' });
      return;
    }
    setVerifyingGateway(true);
    setGatewayMsg({ type: '', text: '' });
    try {
      const res = await fetch(`/api/sites/${siteId}/payment-gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: keyIdInput.trim(),
          keySecret: keySecretInput.trim(),
          merchantName: merchantNameInput.trim() || siteTitle || site?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGatewayMsg({ type: 'error', text: data.error || 'Verification failed.' });
      } else {
        setGatewayMsg({ type: 'success', text: data.message });
        setGatewayStatus({ connected: true, ...data.gateway });
        setKeySecretInput('');
      }
    } catch (err) {
      setGatewayMsg({ type: 'error', text: err.message || 'Verification error' });
    } finally {
      setVerifyingGateway(false);
    }
  };

  // Disconnect Razorpay
  const handleDisconnectRazorpay = async () => {
    if (!confirm('Are you sure you want to disconnect Razorpay from this website?')) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/payment-gateway`, { method: 'DELETE' });
      if (res.ok) {
        setGatewayStatus({ connected: false });
        setGatewayMsg({ type: 'success', text: 'Razorpay disconnected successfully.' });
      }
    } catch (e) {
      console.error('Error disconnecting:', e);
    }
  };

  // Load Google Fonts dynamically
  useEffect(() => {
    const loadFont = (fontFamily) => {
      if (!fontFamily) return;
      const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, '+')}"]`);
      if (existingLink) return;
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };
    loadFont(globalFonts.heading);
    loadFont(globalFonts.body);
  }, [globalFonts.heading, globalFonts.body]);

  // Resolve the effective colors/fonts based on mode
  const effectiveColors = colorMode === 'brandkit' && brandKit?.colors
    ? brandKit.colors
    : globalColors;

  const effectiveFonts = fontMode === 'brandkit' && brandKit?.fonts
    ? brandKit.fonts
    : globalFonts;

  // Favicon upload
  async function handleFaviconUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Favicon must be less than 2MB');
      return;
    }

    try {
      setUploadingFavicon(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/tenants/${tenantId}/media`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      // Store the S3 key for permanent reference (not the presigned URL which expires)
      const key = data.s3Key || data.media?.s3Key || '';
      setFavicon(key);
      // Use the presigned URL for immediate display
      setFaviconDisplayUrl(data.url || data.media?.url || '');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      alert('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
    }
  }

  // Save settings
  async function handleSave() {
    try {
      setSaving(true);
      const globalSettings = {
        siteTitle,
        colorMode,
        globalColors: colorMode === 'custom' ? globalColors : undefined,
        fontMode,
        globalFonts: fontMode === 'custom' ? globalFonts : undefined,
      };

      const res = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: siteTitle || site?.name,
          favicon,
          globalSettings,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fcfdfc]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0b1411]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${tenantId}/sites/${siteId}`)}
                className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm"
                title="Back to Site"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                  {site?.name || 'Site'}
                </p>
                <h1 className="text-3xl font-black text-[#0b1411] uppercase tracking-tight">
                  Global Settings
                </h1>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#d3ff4a] text-[#0b1411] rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.2)] disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Save Settings</>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">

          {/* ─── Site Title ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Site Identity</h2>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Site Title</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold text-sm focus:border-[#0b1411] focus:outline-none"
                placeholder="My Awesome Website"
              />
              <p className="text-xs text-gray-400 mt-1 font-medium">Your website name. Per-page SEO can be edited from the builder toolbar.</p>
            </div>
          </div>

          {/* ─── Favicon ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Favicon</h2>
            </div>
            <div className="flex items-center gap-6">
              {faviconDisplayUrl && (
                <div className="relative group">
                  <img
                    src={faviconDisplayUrl}
                    alt="Favicon"
                    className="w-16 h-16 object-contain border-2 border-gray-100 rounded-xl p-2 bg-gray-50"
                  />
                  <button
                    onClick={() => { setFavicon(''); setFaviconDisplayUrl(''); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
                <button
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploadingFavicon}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl hover:border-[#0b1411] hover:bg-gray-50 transition-all font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {uploadingFavicon ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> {favicon ? 'Change Favicon' : 'Upload Favicon'}</>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Recommended: 32×32 or 64×64 PNG
                </p>
              </div>
            </div>
          </div>

          {/* ─── Global Colors ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Global Colors</h2>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setColorMode('brandkit')}
                className={`flex-1 p-4 border-2 rounded-xl text-left transition-all ${
                  colorMode === 'brandkit'
                    ? 'border-[#0b1411] bg-[#f2f4f2] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-black text-[#0b1411] uppercase tracking-wider">Use Brand Kit</div>
                <p className="text-xs text-gray-500 mt-1 font-medium">Inherit colors from your organization's brand kit</p>
                {brandKit?.colors && (
                  <div className="flex gap-2 mt-3">
                    {Object.values(brandKit.colors).map((color, i) => (
                      <div key={i} className="w-6 h-6 rounded-md border border-gray-200" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                )}
              </button>
              <button
                onClick={() => setColorMode('custom')}
                className={`flex-1 p-4 border-2 rounded-xl text-left transition-all ${
                  colorMode === 'custom'
                    ? 'border-[#0b1411] bg-[#f2f4f2] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-black text-[#0b1411] uppercase tracking-wider">Custom Colors</div>
                <p className="text-xs text-gray-500 mt-1 font-medium">Set custom colors just for this website</p>
              </button>
            </div>

            {/* Color Pickers — only when custom */}
            {colorMode === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(globalColors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">{key}</label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setGlobalColors(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-14 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setGlobalColors(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm font-bold uppercase focus:border-[#0b1411] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Effective preview */}
            <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Active Colors</p>
              <div className="flex gap-4">
                {Object.entries(effectiveColors).map(([key, color]) => (
                  <div key={key} className="flex-1 text-center">
                    <div className="h-12 rounded-lg border border-gray-200" style={{ backgroundColor: color }} />
                    <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase">{key}</p>
                    <p className="text-[10px] font-mono text-gray-400">{color}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Global Typography ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Type className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Global Typography</h2>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setFontMode('brandkit')}
                className={`flex-1 p-4 border-2 rounded-xl text-left transition-all ${
                  fontMode === 'brandkit'
                    ? 'border-[#0b1411] bg-[#f2f4f2] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-black text-[#0b1411] uppercase tracking-wider">Use Brand Kit</div>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {brandKit?.fonts ? `${brandKit.fonts.heading} / ${brandKit.fonts.body}` : 'No brand kit fonts set'}
                </p>
              </button>
              <button
                onClick={() => setFontMode('custom')}
                className={`flex-1 p-4 border-2 rounded-xl text-left transition-all ${
                  fontMode === 'custom'
                    ? 'border-[#0b1411] bg-[#f2f4f2] shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-black text-[#0b1411] uppercase tracking-wider">Custom Fonts</div>
                <p className="text-xs text-gray-500 mt-1 font-medium">Choose different fonts for this website</p>
              </button>
            </div>

            {/* Font selectors — only when custom */}
            {fontMode === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Heading Font</label>
                  <select
                    value={globalFonts.heading}
                    onChange={(e) => setGlobalFonts(prev => ({ ...prev, heading: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold focus:border-[#0b1411] focus:outline-none"
                    style={{ fontFamily: globalFonts.heading }}
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Body Font</label>
                  <select
                    value={globalFonts.body}
                    onChange={(e) => setGlobalFonts(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold focus:border-[#0b1411] focus:outline-none"
                    style={{ fontFamily: globalFonts.body }}
                  >
                    {GOOGLE_FONTS.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Font preview */}
            <div className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Active Fonts</p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Heading</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: effectiveFonts.heading }}>
                    {effectiveFonts.heading}
                  </p>
                  <p className="text-lg mt-1" style={{ fontFamily: effectiveFonts.heading }}>
                    The quick brown fox jumps
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Body</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: effectiveFonts.body }}>
                    {effectiveFonts.body}
                  </p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ fontFamily: effectiveFonts.body }}>
                    The quick brown fox jumps over the lazy dog. This is how your body text will appear.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Payment Gateway (Razorpay) ──────────────────────────────── */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Payment Gateway (Razorpay)</h2>
                  <p className="text-xs text-gray-500 font-medium">Connect your business account to receive customer payments directly</p>
                </div>
              </div>

              {gatewayStatus?.connected && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} />
                  VERIFIED & ACTIVE
                </span>
              )}
            </div>

            {/* Status Message */}
            {gatewayMsg.text && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 ${
                gatewayMsg.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {gatewayMsg.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span>{gatewayMsg.text}</span>
              </div>
            )}

            {gatewayStatus?.connected ? (
              /* Connected View */
              <div className="p-6 bg-[#f7faf8] border-2 border-emerald-500/20 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Account Merchant</label>
                    <p className="text-base font-black text-[#0b1411]">{gatewayStatus.merchantName || siteTitle || site?.name}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Razorpay Key ID</label>
                    <p className="text-sm font-mono font-bold text-gray-700">{gatewayStatus.keyIdMasked || '••••••••'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Gateway Status</label>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Direct Payouts Enabled
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    All product purchases and subscriptions on <span className="font-bold text-[#0b1411]">{site?.name}</span> are processed directly by your Razorpay account.
                  </p>
                  <button
                    onClick={handleDisconnectRazorpay}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Unlink size={13} />
                    Disconnect Gateway
                  </button>
                </div>
              </div>
            ) : (
              /* Connect Form */
              <div className="space-y-5">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Enter your Razorpay API credentials from your <a href="https://dashboard.razorpay.com/#/app/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold hover:text-indigo-800">Razorpay Dashboard &rarr; Settings &rarr; API Keys</a>.
                  SitePilot will verify the credentials in real-time before activating.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-[#0b1411] uppercase tracking-wider mb-2">
                      Razorpay Key ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={keyIdInput}
                        onChange={(e) => setKeyIdInput(e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-[#0b1411] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#0b1411] uppercase tracking-wider mb-2">
                      Razorpay Key Secret <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={keySecretInput}
                        onChange={(e) => setKeySecretInput(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-[#0b1411] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#0b1411] uppercase tracking-wider mb-2">
                    Business / Store Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={merchantNameInput}
                    onChange={(e) => setMerchantNameInput(e.target.value)}
                    placeholder={siteTitle || site?.name || "e.g. My Premium Store"}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:border-[#0b1411] focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleConnectRazorpay}
                    disabled={verifyingGateway}
                    className="px-6 py-3 bg-[#0b1411] hover:bg-black text-[#d3ff4a] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {verifyingGateway ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#d3ff4a]" />
                        <span>Verifying with Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#d3ff4a]" />
                        <span>Connect & Verify Razorpay</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-gray-400 font-medium">Test & Live keys supported</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
