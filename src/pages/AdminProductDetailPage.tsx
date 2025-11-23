import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import { Shield, Package, ArrowLeft, CheckCircle, Activity, ExternalLink, Leaf, Thermometer, Scale, MapPin, Calendar, Anchor } from 'lucide-react';
import { productAPI, Product } from '../services/api-simple';

export default function AdminProductDetailPage() {
  const { batchId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (batchId) {
          const found = await productAPI.getByBatchId(batchId);
          setProduct(found || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Product Not Found</h2>
          <p className="text-slate-500 mt-2">The product with batch ID {batchId} could not be found.</p>
          <Link to="/admin" className="inline-flex items-center mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-slate-600 font-bold hover:bg-gray-50 hover:text-slate-900 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex gap-3">
            <Link 
              to={`/verify?batch=${product.batch_id}`}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              <Shield className="w-4 h-4" /> Verify Authenticity
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Images & Quick Stats */}
          <div className="space-y-8">
            {/* Main Image Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="aspect-video bg-gray-100 relative group">
                {product.vessel_image_url ? (
                  <img 
                    src={product.vessel_image_url} 
                    alt="Vessel" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-3">
                    <Package className="w-12 h-12 opacity-30" />
                    <span className="text-sm font-bold opacity-50">No Vessel Image Available</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
                  <h3 className="text-white font-black text-xl">{product.vessel_name || 'Unknown Vessel'}</h3>
                  <p className="text-white/80 text-sm font-medium flex items-center gap-2 mt-1">
                    <Anchor className="w-3 h-3" /> {product.fisher_name}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="w-24 h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex-shrink-0 p-2">
                   {product.qr_code_url ? (
                     <img src={product.qr_code_url} alt="QR" className="w-full h-full object-contain mix-blend-multiply" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-8 h-8" /></div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 text-lg">Digital Passport</h4>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Scan this QR code to instantly verify the authenticity and origin of this catch on the blockchain.
                  </p>
                  <div className="mt-3 flex gap-3">
                    <a href={product.qr_code_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">Download PNG</a>
                    <span className="text-gray-300">|</span>
                    <Link to={`/verify?batch=${product.batch_id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">View Public Page</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className={`rounded-2xl border p-6 ${product.blockchain_hash ? 'bg-emerald-50 border-emerald-100' : 'bg-yellow-50 border-yellow-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${product.blockchain_hash ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {product.blockchain_hash ? <CheckCircle className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className={`font-black text-lg ${product.blockchain_hash ? 'text-emerald-900' : 'text-yellow-900'}`}>
                    {product.blockchain_hash ? 'Blockchain Verified' : 'Verification Pending'}
                  </h4>
                  <p className={`text-sm font-medium ${product.blockchain_hash ? 'text-emerald-700' : 'text-yellow-700'}`}>
                    {product.blockchain_hash ? 'This product is permanently recorded on VeChain.' : 'Waiting for blockchain confirmation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Specs */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100">
                      {product.product_type}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider border border-gray-100">
                      Batch: {product.batch_id}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{product.product_name}</h1>
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <MapPin className="w-4 h-4" />
                    {product.catch_location}
                  </div>
                </div>
                <div className="text-left md:text-right bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Current Price</p>
                  <p className="text-3xl font-black text-slate-900">₹{product.price}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">per kg</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Weight</p>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-1">
                    <Scale className="w-4 h-4 text-slate-400" /> {product.weight} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Quality Grade</p>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-slate-400" /> {product.quality_grade}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Catch Date</p>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" /> {new Date(product.catch_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sustainability</p>
                  <p className="text-xl font-black text-slate-900 flex items-center gap-1">
                    <Leaf className="w-4 h-4 text-slate-400" /> {product.sustainability_cert || 'Standard'}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Catch Details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Catch Specifications
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Fishing Method</span>
                    <span className="text-sm font-bold text-slate-900">{product.fishing_method || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Catch Zone</span>
                    <span className="text-sm font-bold text-slate-900">{product.catch_zone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Water Depth</span>
                    <span className="text-sm font-bold text-slate-900">{product.water_depth_m ? `${product.water_depth_m} m` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Water Temperature</span>
                    <span className="text-sm font-bold text-slate-900">{product.water_temperature_c ? `${product.water_temperature_c}°C` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Vessel ID</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{product.vessel_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Processing & Logistics */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Processing & Logistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Processing Facility</span>
                    <span className="text-sm font-bold text-slate-900">{product.processing_facility || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Processed Date</span>
                    <span className="text-sm font-bold text-slate-900">{product.processing_date ? new Date(product.processing_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Expiry Date</span>
                    <span className="text-sm font-bold text-slate-900">{product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Packaging Type</span>
                    <span className="text-sm font-bold text-slate-900">{product.packaging_type || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Storage Temp</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> {product.storage_temperature || product.storage_temperature_c || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Cold Chain</span>
                    <span className="text-sm font-bold text-slate-900">
                      {product.cold_chain_required ? (
                        <span className="text-blue-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Required</span>
                      ) : 'Not Required'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Blockchain Data */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-lg text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="font-black text-slate-400 text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Blockchain Verification Record
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live on Mainnet</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Transaction Hash</p>
                  <p className="text-xs font-mono text-emerald-400 break-all leading-relaxed">{product.blockchain_hash || 'Pending...'}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Block ID</p>
                  <p className="text-xs font-mono text-blue-400 break-all leading-relaxed">{product.vechain_block_id || 'Pending...'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 pt-6 border-t border-slate-800 relative z-10">
                <div className="flex gap-8 w-full sm:w-auto">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Gas Used</p>
                    <p className="text-lg font-black text-white">{product.gas_used || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Block #</p>
                    <p className="text-lg font-black text-white">{product.block_number || 0}</p>
                  </div>
                </div>
                <a 
                  href={`https://explore-testnet.vechain.org/transactions/${product.blockchain_hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  View on VeChain Explorer <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
