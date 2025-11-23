import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Wand2, Fish, Anchor, MapPin, Package, Waves, Thermometer, Navigation } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import { fisherDataAPI, FisherData, productAPI, Product, ProductFormData } from '../services/api-simple';
import { authService } from '../services/auth';

const defaultForm: ProductFormData = {
  productName: '',
  productType: 'Seafood',
  catchLocation: '',
  catchDate: new Date().toISOString().split('T')[0],
  fishingMethod: '',
  vesselName: '',
  fisherName: '',
  processingFacility: '',
  processingDate: '',
  expiryDate: '',
  weight: 0,
  price: 0,
  qualityGrade: '',
  sustainabilityCert: '',
  // Advanced fields
  waterDepth: '',
  waterTemperature: '',
  seaState: '', // Note: ProductFormData might need this added if not present
  gearType: '', // Note: ProductFormData might need this added
  baitType: '', // Note: ProductFormData might need this added
  bycatchMitigation: '', // Note: ProductFormData might need this added
  processingMethod: '', // Note: ProductFormData might need this added
  storageTemperature: '',
  salePriceUnit: 'kg', // Note: ProductFormData might need this added
  saleQuantity: '', // Note: ProductFormData might need this added
  buyerName: '', // Note: ProductFormData might need this added
  destinationMarket: '', // Note: ProductFormData might need this added
  notes: '', // Note: ProductFormData might need this added
  isPublic: true // Note: ProductFormData might need this added
};

const FisherDataEditorPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUser(user);
    const stableId = (user as any).fisher_id || user.id || user.email;
    if (isEdit && id) {
      loadRecord(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadRecord = async (batchId: string) => {
    setLoading(true);
    try {
      const data = await productAPI.getByBatchId(batchId);
      if (!data) {
        throw new Error('No data returned from API');
      }
      // Map Product to ProductFormData
      setForm({
        productName: data.product_name,
        productType: data.product_type,
        catchLocation: data.catch_location,
        catchDate: data.catch_date,
        fishingMethod: data.fishing_method,
        vesselName: data.vessel_name,
        fisherName: data.fisher_name,
        processingFacility: data.processing_facility,
        processingDate: data.processing_date,
        expiryDate: data.expiry_date,
        weight: data.weight,
        price: data.price,
        qualityGrade: data.quality_grade,
        sustainabilityCert: data.sustainability_cert,
        waterDepth: data.water_depth_m?.toString() || '',
        waterTemperature: data.water_temperature_c?.toString() || '',
        storageTemperature: data.storage_temperature_c?.toString() || '',
        // Map other fields if they exist in Product
      } as ProductFormData);
      toast.success('Record loaded');
    } catch (e: any) {
      console.error('Load error:', e);
      toast.error(e?.message || 'Failed to load record');
      setTimeout(() => navigate('/fisher/catches'), 2000);
    } finally { 
      setLoading(false); 
    }
  };

  const stableId = useMemo(() => (currentUser?.fisher_id || currentUser?.id || currentUser?.email), [currentUser]);

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stableId) return;
    setSaving(true);
    try {
      // Ensure fisher info is attached
      const submission = { 
        ...form, 
        fisherId: stableId,
        fisherName: currentUser.full_name || 'Unknown Fisher'
      };

      if (isEdit && id) {
        // Update not fully supported in productAPI yet for all fields, but let's assume create for now or implement update
        // For blockchain immutability, updates might be restricted.
        toast.error("Updates to blockchain records are restricted.");
      } else {
        const created = await productAPI.createFromForm(submission);
        toast.success('Catch recorded on blockchain!');
        
        // Upload cover image if selected
        if (coverFile && created.batch_id) {
             try {
               await productAPI.uploadMedia(created.batch_id, coverFile, form.vesselName);
               toast.success("Image uploaded successfully");
             } catch (err) {
               console.error("Failed to upload cover image", err);
               toast.error("Catch saved, but image upload failed");
             }
        }
      }
      navigate(`/fisher/catches`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save record');
    } finally { setSaving(false); }
  };

  const handleAIParse = async () => {
    if (!aiInput.trim()) return;
    try {
      const result = await fisherDataAPI.aiParse(aiInput);
      const parsed = (result as any)?.data || result;
      setForm(prev => ({ ...prev, ...parsed }));
      toast.success('AI filled fields');
      setAiModalOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('AI parse failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <SiteHeader />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-blue-50">
        <SiteHeader />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-xl border-2 border-blue-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Anchor className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black text-blue-900 mb-4">Fisher Login Required</h2>
            <p className="text-lg text-blue-600 mb-8">Please login to create or edit your catch data record.</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/login" className="px-8 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg">Login as Fisher</Link>
              <Link to="/" className="px-8 py-3 bg-white text-blue-900 rounded-xl font-bold hover:bg-blue-50 border-2 border-blue-200 transition-all">Go Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/fisher/catches" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 transition-colors text-blue-900 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to My Catches
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setAiModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-900 font-bold hover:bg-blue-200 transition-all border border-blue-200">
              <Wand2 className="w-4 h-4" />
              AI Fill
            </button>
            <button form="fd-form" type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-all disabled:opacity-60 shadow-md">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <form id="fd-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Catch Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Fish className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-black text-blue-900">Catch Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Species Name</label>
                  <input 
                    value={form.productName || ''} 
                    onChange={(e) => handleChange('productName', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                    placeholder="e.g. Tuna, Mackerel" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Variety/Type</label>
                    <input 
                      value={form.productType || ''} 
                      onChange={(e) => handleChange('productType', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Yellowfin" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Catch Date</label>
                    <input 
                      type="date"
                      value={form.catchDate || ''} 
                      onChange={(e) => handleChange('catchDate', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={form.weight ?? 0} 
                      onChange={(e) => handleChange('weight', Number(e.target.value))} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Vessel Name</label>
                    <input 
                      value={form.vesselName || ''} 
                      onChange={(e) => handleChange('vesselName', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Sea Warrior" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Quality Grade</label>
                  <select 
                    value={form.qualityGrade || ''} 
                    onChange={(e) => handleChange('qualityGrade', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 bg-white"
                  >
                    <option value="">Select Grade</option>
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Canning)</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3">
                    <label className="block text-sm font-bold text-blue-900 mb-1">Certifications / Sustainability</label>
                    <input 
                      value={form.sustainabilityCert || ''} 
                      onChange={(e) => handleChange('sustainabilityCert', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. MSC, Fair Trade" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trip & Environment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-black text-blue-900">Trip & Environment</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Trip ID</label>
                  <input 
                    value={form.tripId || ''} 
                    onChange={(e) => handleChange('tripId', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                    placeholder="e.g. TRIP-2025-001" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Depth (m)</label>
                    <input 
                      type="number"
                      value={form.waterDepth ?? ''} 
                      onChange={(e) => handleChange('waterDepth', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900" 
                      placeholder="e.g. 50" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Water Temp (°C)</label>
                    <input 
                      type="number"
                      value={form.waterTemperature ?? ''} 
                      onChange={(e) => handleChange('waterTemperature', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900" 
                      placeholder="e.g. 24" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Sea State</label>
                    <input 
                      value={form.seaState || ''} 
                      onChange={(e) => handleChange('seaState', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Calm, Choppy" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Location / Coordinates</label>
                    <input 
                      value={form.catchLocation || ''} 
                      onChange={(e) => handleChange('catchLocation', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="Lat, Long or Zone" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Gear & Methods */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Anchor className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-black text-blue-900">Gear & Methods</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Fishing Method</label>
                  <input 
                    value={form.fishingMethod || ''} 
                    onChange={(e) => handleChange('fishingMethod', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                    placeholder="e.g. Longline, Net" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Gear Type</label>
                    <input 
                      value={form.gearType || ''} 
                      onChange={(e) => handleChange('gearType', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Gillnet" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Bait Type</label>
                    <input 
                      value={form.baitType || ''} 
                      onChange={(e) => handleChange('baitType', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Squid" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Bycatch Mitigation</label>
                  <input 
                    value={form.bycatchMitigation || ''} 
                    onChange={(e) => handleChange('bycatchMitigation', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                    placeholder="e.g. Circle hooks" 
                  />
                </div>
              </div>
            </div>

            {/* Processing & Storage */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-black text-blue-900">Processing & Storage</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Processing Method</label>
                  <input 
                    value={form.processingMethod || ''} 
                    onChange={(e) => handleChange('processingMethod', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                    placeholder="e.g. Iced, Frozen" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Storage Temperature</label>
                  <input 
                    value={form.storageTemperature || ''} 
                    onChange={(e) => handleChange('storageTemperature', e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                    placeholder="e.g. -4°C" 
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Sale Price</label>
                    <input 
                      type="number" 
                      value={form.price ?? ''} 
                      onChange={(e) => handleChange('price', Number(e.target.value))} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900" 
                      placeholder="INR" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Unit</label>
                    <select 
                      value={form.salePriceUnit || 'kg'} 
                      onChange={(e) => handleChange('salePriceUnit', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="piece">piece</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Quantity (kg)</label>
                    <input 
                      type="number" 
                      value={form.saleQuantity ?? ''} 
                      onChange={(e) => handleChange('saleQuantity', Number(e.target.value))} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Buyer</label>
                    <input 
                      value={form.buyerName || ''} 
                      onChange={(e) => handleChange('buyerName', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Local Market" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-1">Market</label>
                    <input 
                      value={form.destinationMarket || ''} 
                      onChange={(e) => handleChange('destinationMarket', e.target.value)} 
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                      placeholder="e.g. Chennai" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Waves className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-black text-blue-900">Notes</h3>
            </div>
            <textarea 
              value={form.notes || ''} 
              onChange={(e) => handleChange('notes', e.target.value)} 
              className="w-full min-h-[140px] px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
              placeholder="Any additional notes about the catch, weather conditions, or observations..." 
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-black text-blue-900">Media</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Cover Image</label>
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="block w-full text-sm text-blue-700" />
              </div>
              {/* Image preview logic would need update if we support it in ProductFormData */}
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Traceability Code / Tags</label>
                <input 
                  value={form.traceabilityCode || ''} 
                  onChange={(e) => handleChange('traceabilityCode', e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 placeholder-blue-300" 
                  placeholder="e.g. TRACE-123" 
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-blue-900">Public</label>
                <select 
                  value={String(form.isPublic ?? 'true')} 
                  onChange={(e) => handleChange('isPublic', e.target.value === 'true')} 
                  className="px-3 py-2 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-0 outline-none font-medium text-blue-900 bg-white"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate('/fisher/catches')} className="px-4 py-2 rounded-xl border-2 border-blue-200 text-blue-900 font-bold hover:bg-blue-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-all disabled:opacity-60 shadow-md">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>

        {aiModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl border-2 border-blue-900">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-blue-900" />
                  <h3 className="text-lg font-black text-blue-900">AI Fill from Text</h3>
                </div>
                <button onClick={() => setAiModalOpen(false)} className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold">Close</button>
              </div>
              <textarea 
                value={aiInput} 
                onChange={(e) => setAiInput(e.target.value)} 
                placeholder="Paste any notes about your catch. We'll extract fields like species, weight, date, location, method, etc." 
                className="w-full min-h-[160px] px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-900 focus:ring-0 outline-none mb-4 font-medium text-blue-900 placeholder-blue-300" 
              />
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 rounded-xl border-2 border-blue-200 text-blue-900 font-bold hover:bg-blue-50">Cancel</button>
                <button onClick={handleAIParse} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-all shadow-md">
                  <Wand2 className="w-4 h-4" />
                  Fill Fields
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FisherDataEditorPage;
