import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle,
  ArrowLeft,
  Anchor,
  Ship,
  Thermometer,
  Navigation,
  Waves,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import SiteHeader from '../components/SiteHeader';
import { authService } from '../services/auth';
import { productAPI, ProductFormData } from '../services/api-simple';
import axios from 'axios';

export default function DataEntryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [entryMode, setEntryMode] = useState<'product' | 'vessel'>('product');
  const [vessels, setVessels] = useState<any[]>([]);

  const [vesselData, setVesselData] = useState({
    owner_name: '',
    owner_contact: '',
    owner_email: '',
    owner_address: '',
    name: '',
    registration_number: '',
    type: '',
    home_port: '',
    fishing_license_number: '',
    crew_capacity: '',
    storage_capacity_kg: '',
    engine_power_hp: '',
    fuel_type: '',
    vessel_image_url: '',
    vessel_documents_url: '',
    owner_id_proof_url: ''
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    owner_id_proof_url?: File | null;
    vessel_documents_url?: File | null;
    vessel_image_url?: File | null;
  }>({});

  const [formData, setFormData] = useState<Omit<ProductFormData, 'weight' | 'price'> & {
    weight: number | string;
    price: number | string;
    vessel_id?: string;
    catchZone?: string;
    waterDepth?: string;
    waterTemperature?: string;
    storageTemperature?: string;
    packagingType?: string;
    coldChainRequired?: boolean;
  }>({
    productName: '',
    productType: '',
    catchLocation: '',
    catchDate: '',
    fishingMethod: '',
    vesselName: '',
    fisherName: '',
    fisherId: '', // Add fisherId to initial state
    processingFacility: '',
    processingDate: '',
    expiryDate: '',
    weight: '',
    price: '',
    qualityGrade: '',
    sustainabilityCert: '',
    vessel_id: '',
    catchZone: '',
    waterDepth: '',
    waterTemperature: '',
    storageTemperature: '',
    packagingType: '',
    coldChainRequired: false
  });
  
  // Calculate form completion percentage
  const requiredFields = ['productName', 'productType', 'weight', 'price', 'qualityGrade', 'fisherName', 'catchLocation', 'catchDate', 'vessel_id'];
  const completedFields = requiredFields.filter(field => {
    const value = formData[field as keyof typeof formData];
    return value !== '' && value !== null && value !== undefined;
  }).length;
  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      autoFillFisherDetails(user);
      fetchVessels(user.id);
    } else {
      setVessels([]);
      toast.error('Please log in to register catches');
    }
  }, []);

  const fetchVessels = async (userId?: string) => {
    if (!userId) {
      console.log('No user ID provided for vessel fetch');
      setVessels([]);
      return;
    }

    try {
      console.log('Fetching vessels for user:', userId);
      const url = `http://localhost:8005/api/vessels?owner_id=${encodeURIComponent(userId)}`;
      const response = await axios.get(url);
      const fetchedVessels = response.data || [];
      console.log('Fetched vessels:', fetchedVessels.length);
      setVessels(fetchedVessels);
      
      // Auto-select first vessel if available
      if (fetchedVessels.length > 0) {
        const firstVessel = fetchedVessels[0];
        console.log('Auto-selecting vessel:', firstVessel.name);
        setFormData(prev => ({
          ...prev,
          vessel_id: firstVessel.id,
          vesselName: firstVessel.name
        }));
      } else {
        console.log('No vessels found for user');
        toast('No vessels registered. Please register a vessel first.', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Failed to fetch vessels', error);
      toast.error('Failed to load your vessels');
      setVessels([]);
    }
  };

  const productTypes = [
    'Tuna (Yellowfin)',
    'Tuna (Skipjack)',
    'Mackerel (Indian)',
    'Sardine (Oil)',
    'Shrimp (Tiger)',
    'Shrimp (White)',
    'Crab (Mud)',
    'Crab (Blue)',
    'Squid',
    'Cuttlefish',
    'Lobster',
    'Seer Fish',
    'Pomfret (Silver)',
    'Pomfret (Black)',
    'Anchovy',
    'Grouper',
    'Snapper',
    'Barracuda'
  ];

  const grades = ['Premium Export', 'Grade A', 'Grade B', 'Domestic Standard'];
  const fishingMethods = [
    'Trawling', 
    'Gillnetting', 
    'Longlining', 
    'Purse Seining', 
    'Pole & Line', 
    'Trap/Pot Fishing',
    'Handline',
    'Diving'
  ];
  const sustainabilityCerts = [
    'MSC Certified', 
    'FOS Certified', 
    'Fair Trade Seafood', 
    'Dolphin Safe', 
    'Responsible Fishing Scheme',
    'Local Sustainable'
  ];

  const handleVesselSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVesselId = e.target.value;
    const selectedVessel = vessels.find(v => v.id === selectedVesselId);
    
    setFormData(prev => ({
      ...prev,
      vessel_id: selectedVesselId,
      vesselName: selectedVessel ? selectedVessel.name : prev.vesselName
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : value) : value
    }));
  };

  const handleVesselChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVesselData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-fill fisher details based on user role and location
  const autoFillFisherDetails = (user: any) => {
    if (user) {
      const fisherName = user.full_name || user.email?.split('@')[0] || '';
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate expiry date (1 year from today for most products)
      const expiryDate = new Date(today);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      const expiryStr = expiryDate.toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        fisherName,
        fisherId: user.id, // Added fisherId
        vesselName: `${fisherName.split(' ')[0]}'s Vessel`,
        catchLocation: 'Bay of Bengal, Zone 4',
        catchDate: todayStr,
        processingDate: todayStr,
        processingFacility: 'Chennai Coastal Processing Unit',
        expiryDate: expiryStr,
        fishingMethod: 'Gillnetting',
        sustainabilityCert: 'Local Sustainable',
        catchZone: 'FAO 57',
        waterDepth: '45',
        waterTemperature: '28',
        storageTemperature: '-18'
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store file for later upload
    setSelectedFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVesselData(prev => ({
      ...prev,
      [fieldName]: previewUrl
    }));
    
    toast.success('File selected');
  };

  const handleVesselSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        toast.error('Please log in to register a vessel');
        setLoading(false);
        return;
      }
      // Upload files first
      const uploadedUrls: Record<string, string> = {};
      
      for (const [key, file] of Object.entries(selectedFiles)) {
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          if (vesselData.name) {
            formData.append('vessel_name', vesselData.name);
          }
          try {
            const uploadRes = await axios.post('http://localhost:8005/api/vessels/upload', formData);
            uploadedUrls[key] = uploadRes.data.url;
          } catch (err) {
            console.error(`Failed to upload ${key}`, err);
            toast.error(`Failed to upload file for ${key.replace(/_/g, ' ')}`);
            setLoading(false);
            return;
          }
        }
      }

      // Convert numeric fields to numbers or null if empty
      const payload = {
        ...vesselData,
        ...uploadedUrls, // Override preview URLs with real server URLs
        owner_id: user?.id,
        crew_capacity: vesselData.crew_capacity ? parseInt(vesselData.crew_capacity) : null,
        storage_capacity_kg: vesselData.storage_capacity_kg ? parseFloat(vesselData.storage_capacity_kg) : null,
        engine_power_hp: vesselData.engine_power_hp ? parseFloat(vesselData.engine_power_hp) : null,
      };

      await axios.post('http://localhost:8005/api/vessels', payload);
      toast.success('Vessel registered successfully!');
      setVesselData({
        owner_name: '',
        owner_contact: '',
        owner_email: '',
        owner_address: '',
        name: '',
        registration_number: '',
        type: '',
        home_port: '',
        fishing_license_number: '',
        crew_capacity: '',
        storage_capacity_kg: '',
        engine_power_hp: '',
        fuel_type: '',
        vessel_image_url: '',
        vessel_documents_url: '',
        owner_id_proof_url: ''
      });
      setSelectedFiles({});
      // Re-fetch vessels for the current user
      if (user?.id) {
        await fetchVessels(user.id);
      }
      setEntryMode('product');
    } catch (error: any) {
      console.error('Vessel registration failed:', error);
      let errorMessage = 'Vessel registration failed';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => e.msg).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMessage = JSON.stringify(detail);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.productName || !formData.fisherName || !formData.catchLocation || 
          !formData.catchDate || !formData.productType || !formData.weight || !formData.vessel_id) {
        toast.error('Please fill in all required fields, including Vessel');
        setLoading(false);
        return;
      }

      // Map new fields to API format if needed, though api-simple.ts should handle it
      // We might need to ensure api-simple.ts transformFormData handles the new fields
      const product = await productAPI.createFromForm(formData as any);
      
      toast.success(`Catch registered! Batch ID: ${product.batch_id}`);
      
      setTimeout(() => {
        navigate('/verify', { 
          state: { 
            batchId: product.batch_id,
            blockchainHash: product.blockchain_hash,
            productData: product
          } 
        });
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => e.msg).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMessage = JSON.stringify(detail);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillTestVesselData = () => {
    setVesselData({
      owner_name: 'John Fisher',
      owner_contact: '9876543210',
      owner_email: 'john.fisher@example.com',
      owner_address: '123 Coastal Road, Chennai',
      name: 'Ocean Explorer ' + Math.floor(Math.random() * 1000),
      registration_number: 'TN-02-MM-' + Math.floor(Math.random() * 10000),
      type: 'Trawler',
      home_port: 'Chennai',
      fishing_license_number: 'LIC-' + Math.floor(Math.random() * 100000),
      crew_capacity: '8',
      storage_capacity_kg: '5000',
      engine_power_hp: '350',
      fuel_type: 'Diesel',
      vessel_image_url: '',
      vessel_documents_url: '',
      owner_id_proof_url: ''
    });
    toast.success('Test data filled!');
  };

  const fillTestProductData = () => {
    setFormData({
      productName: 'Yellowfin Tuna',
      productType: 'Tuna (Yellowfin)',
      catchLocation: 'Bay of Bengal, Zone 4',
      catchDate: new Date().toISOString().split('T')[0],
      fishingMethod: 'Longlining',
      vesselName: 'Ocean Explorer',
      fisherName: 'John Fisher',
      processingFacility: 'Chennai Coastal Processing Unit',
      processingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weight: '150.5',
      price: '45000',
      qualityGrade: 'Grade A',
      sustainabilityCert: 'MSC Certified',
      vessel_id: vessels.length > 0 ? vessels[0].id : '',
      catchZone: 'FAO 57',
      waterDepth: '120',
      waterTemperature: '26.5',
      storageTemperature: '-18'
    });
    toast.success('Test catch data filled!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-gray-100 hover:border-emerald-200 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:text-emerald-600 transition-colors" />
              <span className="font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl border-2 border-transparent shadow-lg">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-sm font-black text-white uppercase tracking-wide">VeChain Blockchain Secured</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white via-emerald-25 to-emerald-50 rounded-3xl shadow-2xl border border-emerald-200 p-8 sm:p-10">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${entryMode === 'product' ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-indigo-600'} rounded-2xl shadow-lg flex items-center justify-center transition-colors duration-300`}>
                  {entryMode === 'product' ? <Package className="w-8 h-8 text-white" /> : <Ship className="w-8 h-8 text-white" />}
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
                {entryMode === 'product' ? 'Register Your Product' : 'Register Vessel'}
              </h1>
              <div className="flex justify-center gap-2 mb-4">
                <button 
                  type="button"
                  onClick={entryMode === 'product' ? fillTestProductData : fillTestVesselData}
                  className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 font-medium transition-colors"
                >
                  Fill Test Data
                </button>
              </div>
              <p className="text-lg text-gray-600 font-medium mb-6 max-w-2xl mx-auto leading-relaxed">
                {entryMode === 'product' 
                  ? 'Secure your seafood products with blockchain technology. Create a digital identity for your catch.'
                  : 'Register your fishing vessel on the blockchain for transparent catch reporting and traceability.'}
              </p>
              
              {/* Entry Mode Toggle */}
              <div className="flex justify-center mt-6">
                <div className="bg-white p-1.5 rounded-xl shadow-lg border border-gray-200 inline-flex">
                  <button
                    onClick={() => setEntryMode('product')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                      entryMode === 'product'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    Catch Entry
                  </button>
                  <button
                    onClick={() => setEntryMode('vessel')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                      entryMode === 'vessel'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Ship className="w-5 h-5" />
                    Vessel Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {entryMode === 'vessel' ? (
          /* Vessel Form */
          <form onSubmit={handleVesselSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Anchor className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vessel Owner Details</h2>
                  <p className="text-gray-600">Information about the vessel owner</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={vesselData.owner_name}
                    onChange={handleVesselChange}
                    placeholder="Owner's Full Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="owner_contact"
                    value={vesselData.owner_contact}
                    onChange={handleVesselChange}
                    placeholder="Contact Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="owner_email"
                    value={vesselData.owner_email}
                    onChange={handleVesselChange}
                    placeholder="Email Address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    name="owner_address"
                    value={vesselData.owner_address}
                    onChange={handleVesselChange}
                    placeholder="Complete Address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Proof (Upload Image/PDF)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'owner_id_proof_url')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept="image/*,.pdf"
                      />
                    </div>
                    {vesselData.owner_id_proof_url && (
                      <div className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    )}
                  </div>
                  {vesselData.owner_id_proof_url && (
                    <p className="mt-2 text-xs text-gray-500 truncate">
                      URL: {vesselData.owner_id_proof_url}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Ship className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vessel Details</h2>
                  <p className="text-gray-600">Register a new vessel for catch reporting</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Image (Upload)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'vessel_image_url')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept="image/*"
                      />
                    </div>
                    {vesselData.vessel_image_url && (
                      <div className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    )}
                  </div>
                  {vesselData.vessel_image_url && (
                    <div className="mt-2">
                      <img src={vesselData.vessel_image_url} alt="Vessel Preview" className="h-20 w-auto rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={vesselData.name}
                    onChange={handleVesselChange}
                    placeholder="e.g. Sea Warrior"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Number (e.g., TN02T2756)
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={vesselData.registration_number}
                    onChange={handleVesselChange}
                    placeholder="e.g. TN02T2756"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Vessel Type
                  </label>
                  <select
                    name="type"
                    value={vesselData.type}
                    onChange={handleVesselChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select Type</option>
                    <option value="Trawler">Trawler</option>
                    <option value="Gillnetter">Gillnetter</option>
                    <option value="Longliner">Longliner</option>
                    <option value="Purse Seiner">Purse Seiner</option>
                    <option value="Traditional Craft">Traditional Craft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Home Port
                  </label>
                  <input
                    type="text"
                    name="home_port"
                    value={vesselData.home_port}
                    onChange={handleVesselChange}
                    placeholder="e.g. Chennai"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fishing License Number
                  </label>
                  <input
                    type="text"
                    name="fishing_license_number"
                    value={vesselData.fishing_license_number}
                    onChange={handleVesselChange}
                    placeholder="License Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Crew Capacity
                  </label>
                  <input
                    type="number"
                    name="crew_capacity"
                    value={vesselData.crew_capacity}
                    onChange={handleVesselChange}
                    placeholder="Max Crew"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Storage Capacity (kg)
                  </label>
                  <input
                    type="number"
                    name="storage_capacity_kg"
                    value={vesselData.storage_capacity_kg}
                    onChange={handleVesselChange}
                    placeholder="Storage Capacity"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Engine Power (HP)
                  </label>
                  <input
                    type="number"
                    name="engine_power_hp"
                    value={vesselData.engine_power_hp}
                    onChange={handleVesselChange}
                    placeholder="Engine Power"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Fuel Type
                  </label>
                  <select
                    name="fuel_type"
                    value={vesselData.fuel_type}
                    onChange={handleVesselChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Kerosene">Kerosene</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Documents (Upload PDF/Image)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e, 'vessel_documents_url')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        accept="image/*,.pdf"
                      />
                    </div>
                    {vesselData.vessel_documents_url && (
                      <div className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    )}
                  </div>
                  {vesselData.vessel_documents_url && (
                    <p className="mt-2 text-xs text-gray-500 truncate">
                      URL: {vesselData.vessel_documents_url}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🆔</div>
                <div>
                  <div className="text-sm font-bold text-gray-600">Owner ID: <span className="text-blue-700">NA39755</span></div>
                  <div className="text-sm font-bold text-gray-600">Vessel ID: <span className="text-blue-700">NAD39755</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
                <button
                type="button"
                onClick={() => {
                  setVesselData({
                    owner_name: '',
                    owner_contact: '',
                    owner_email: '',
                    owner_address: '',
                    name: '',
                    registration_number: '',
                    type: '',
                    home_port: '',
                    fishing_license_number: '',
                    crew_capacity: '',
                    storage_capacity_kg: '',
                    engine_power_hp: '',
                    fuel_type: '',
                    vessel_image_url: '',
                    vessel_documents_url: '',
                    owner_id_proof_url: ''
                  });
                  setSelectedFiles({});
                }}
                className="px-8 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-4 px-16 py-4 rounded-xl font-black text-xl shadow-xl transition-all transform ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-2xl hover:scale-105 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Ship className="w-6 h-6" />
                    <span>Register Vessel</span>
                  </>
                )}
              </button>
            </div>

            {/* Registered Vessels List */}
            <div className="mt-12">
              <h3 className="text-xl font-black text-gray-900 mb-6">Registered Vessels:</h3>
              <div className="grid gap-4">
                {vessels.length > 0 ? (
                  vessels.map((vessel) => (
                    <div key={vessel.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-900">{vessel.name}</h4>
                        <p className="text-sm text-gray-600">{vessel.registration_number} • {vessel.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Active</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    No vessels registered yet.
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          /* Product Form */
          <form onSubmit={handleProductSubmit} className="space-y-6">
            {/* Product Information Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Catch Details</h2>
                  <p className="text-gray-600">Basic information about the catch</p>
                </div>
              </div>
              
              {/* Form completion indicator */}
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-700 font-medium">Form Completion: {completionPercentage}%</span>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium">Auto-filled from account</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      completionPercentage >= 100 ? 'bg-emerald-500' : 
                      completionPercentage >= 75 ? 'bg-blue-500' : 
                      completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Species Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="e.g. Yellowfin Tuna"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seafood Type *
                  </label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select type</option>
                    {productTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="Enter weight in kg"
                    min="0"
                    step="0.1"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price in rupees"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quality Grade *
                  </label>
                  <select
                    name="qualityGrade"
                    value={formData.qualityGrade}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sustainability Certification
                  </label>
                  <select
                    name="sustainabilityCert"
                    value={formData.sustainabilityCert}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select certification</option>
                    {sustainabilityCerts.map(cert => (
                      <option key={cert} value={cert}>{cert}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Vessel & Fisher Information Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Ship className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vessel & Fisher Information</h2>
                  <p className="text-gray-600">Details about the vessel and fisher</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fisher Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fisherName"
                      value={formData.fisherName}
                      onChange={handleInputChange}
                      placeholder="Your name (auto-filled from account)"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 text-gray-900"
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Name
                  </label>
                  <input
                    type="text"
                    name="vesselName"
                    value={formData.vesselName}
                    onChange={handleInputChange}
                    placeholder="Enter vessel name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Landing Center Location *
                  </label>
                  <input
                    type="text"
                    name="catchLocation"
                    value={formData.catchLocation}
                    onChange={handleInputChange}
                    placeholder="Port, District, State"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                {/* Vessel Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Registered Vessel *
                  </label>
                  <div className="relative">
                    <select
                      name="vessel_id"
                      value={formData.vessel_id || ''}
                      onChange={handleVesselSelect}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 appearance-none"
                    >
                      <option value="">Select your vessel</option>
                      {vessels.map(vessel => (
                        <option key={vessel.id} value={vessel.id}>
                          {vessel.name} ({vessel.registration_number})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                      <Ship className="w-4 h-4" />
                    </div>
                  </div>
                  {vessels.length === 0 && (
                    <p className="text-sm text-red-500 mt-2 font-medium">
                      You don't have any registered vessels. Please register a vessel first to continue.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Don't see your vessel? <button type="button" onClick={() => setEntryMode('vessel')} className="text-blue-600 hover:underline">Register it here</button>
                  </p>
                </div>
              </div>
            </div>

            {/* Catch & Processing Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Catch & Processing</h2>
                  <p className="text-gray-600">Timeline and processing information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catch Date *
                  </label>
                  <input
                    type="date"
                    name="catchDate"
                    value={formData.catchDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fishing Method
                  </label>
                  <select
                    name="fishingMethod"
                    value={formData.fishingMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select method</option>
                    {fishingMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                {/* Advanced Catch Data */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catch Zone (FAO/Region)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="catchZone"
                      value={formData.catchZone}
                      onChange={handleInputChange}
                      placeholder="e.g. FAO 57"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Water Depth (meters)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="waterDepth"
                      value={formData.waterDepth}
                      onChange={handleInputChange}
                      placeholder="Depth in meters"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Anchor className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Processing Facility
                  </label>
                  <input
                    type="text"
                    name="processingFacility"
                    value={formData.processingFacility}
                    onChange={handleInputChange}
                    placeholder="Enter processing facility name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Processing Date
                  </label>
                  <input
                    type="date"
                    name="processingDate"
                    value={formData.processingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Storage Temp (°C)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="storageTemperature"
                      value={formData.storageTemperature}
                      onChange={handleInputChange}
                      placeholder="e.g. -18"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Thermometer className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Packaging Type
                  </label>
                  <select
                    name="packagingType"
                    value={formData.packagingType || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">Select Packaging</option>
                    <option value="Vacuum Sealed">Vacuum Sealed</option>
                    <option value="Ice Box">Ice Box</option>
                    <option value="Canned">Canned</option>
                    <option value="Insulated Bin">Insulated Bin</option>
                  </select>
                </div>

                <div className="flex items-center mt-8">
                  <input
                    type="checkbox"
                    name="coldChainRequired"
                    id="coldChainRequired"
                    checked={formData.coldChainRequired || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, coldChainRequired: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="coldChainRequired" className="ml-2 block text-sm font-semibold text-gray-700">
                    Cold Chain Required?
                  </label>
                </div>
              </div>
            </div>

            {/* Registration Info */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-emerald-600" />
                <h3 className="text-lg font-black text-gray-900">Secure & Verified Registration</h3>
              </div>
              <p className="text-gray-700 font-medium leading-relaxed">
                Your catch information will be securely registered on the blockchain, providing permanent verification and traceability. Once registered, you'll receive a unique QR code for your product.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-8">
              <button
                type="submit"
                disabled={loading || completionPercentage < 100}
                className={`inline-flex items-center gap-4 px-16 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all transform ${
                  loading || completionPercentage < 100
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-3xl hover:scale-105 text-white'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-7 h-7 border-3 border-white border-t-transparent rounded-full"></div>
                    <span>Registering Catch...</span>
                  </>
                ) : completionPercentage < 100 ? (
                  <>
                    <Shield className="w-7 h-7" />
                    <span>Complete Form to Register</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-7 h-7" />
                    <span>Register Catch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </main>
    </div>
  );
}
