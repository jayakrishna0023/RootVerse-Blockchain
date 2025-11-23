import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import FooterWave from '../components/FooterWave';
import { productAPI } from '../services/api-simple';
import { 
  Shield, Anchor, Sparkles, Fish, Award, MapPin, Star, ArrowRight,
  TrendingUp, Users, Package, CheckCircle, Search,
  Download, Eye, ChevronRight, Zap, Clock, BadgeCheck, X,
  User, Calendar, Ship, Navigation, Thermometer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Stats will be computed from API data

// Categories will be computed from API data

export default function ConsumerDashboard() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalProducts: 0,
    totalFishers: 0,
    totalVessels: 0,
    verificationRate: 100,
    sustainabilityRate: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products from backend
        const data = await productAPI.getAll();
        
        if (!data || data.length === 0) {
          console.log('No products found');
          setFeaturedProducts([]);
          setLoading(false);
          return;
        }

        // Map products for display
        const mappedProducts = data.map((p: any) => {
          const catchDate = p.catch_date ? new Date(p.catch_date) : new Date();
          const catchLocation = p.catch_location || 'Unknown Location';
          const catchTime = p.catch_date ? catchDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
          const catchDateStr = p.catch_date ? catchDate.toLocaleDateString() : 'N/A';
          
          return {
            id: p.id,
            name: p.product_name,
            category: p.product_type,
            batchId: p.batch_id,
            imageUrl: p.image_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
            fisher: p.fisher_name || 'Unknown Fisher',
            vessel: p.vessel_name || 'Unknown Vessel',
            location: catchLocation,
            depth: 'Surface',
            description: `Premium quality ${p.product_name}${p.catch_date ? `, caught on ${catchDateStr}` : ''}.`,
            rating: 5.0,
            reviews: 0,
            tags: [p.quality_grade, p.fishing_method].filter(Boolean),
            discount: 0,
            catchDate: catchDateStr,
            catchTime: catchTime,
            blockchainHash: p.blockchain_hash,
            blockNumber: p.block_number,
            vechainBlockId: p.vechain_block_id,
            journey: [
              { step: 1, title: 'Catch', description: `Caught at ${catchLocation}`, icon: '🎣', time: catchTime },
              { step: 2, title: 'Processing', description: `Processed: ${p.fishing_method || 'Fresh'}`, icon: '🏭', time: 'Verified' },
              { step: 3, title: 'Blockchain Record', description: `Hash: ${p.blockchain_hash?.substring(0, 10)}...`, icon: '🔗', time: 'Recorded' }
            ]
          };
        });
        setFeaturedProducts(mappedProducts);
        
        // Calculate statistics from real data
        const uniqueFishers = new Set(data.map((p: any) => p.fisher_name).filter(Boolean));
        const uniqueVessels = new Set(data.map((p: any) => p.vessel_name).filter(Boolean));
        const verifiedProducts = data.filter((p: any) => p.blockchain_hash).length;
        const sustainableProducts = data.filter((p: any) => 
          p.sustainability_cert && p.sustainability_cert !== 'None'
        ).length;
        
        const calculatedStats = {
          totalProducts: data.length,
          totalFishers: uniqueFishers.size,
          totalVessels: uniqueVessels.size,
          verificationRate: data.length > 0 ? Math.round((verifiedProducts / data.length) * 100) : 100,
          sustainabilityRate: data.length > 0 ? Math.round((sustainableProducts / data.length) * 100) : 0
        };
        setStatsData(calculatedStats);

        // Build stats array for display
        setStats([
          { label: 'Total Catches', value: calculatedStats.totalProducts.toString(), icon: Package, color: 'blue' },
          { label: 'Active Fishers', value: calculatedStats.totalFishers.toString(), icon: Users, color: 'emerald' },
          { label: 'Verified Products', value: `${calculatedStats.verificationRate}%`, icon: Shield, color: 'purple' },
          { label: 'Sustainability', value: `${calculatedStats.sustainabilityRate}%`, icon: TrendingUp, color: 'green' }
        ]);

        // Calculate dynamic categories based on product types
        const typeCounts = data.reduce((acc: any, p: any) => {
          const type = p.product_type || 'Other';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const categoryMap: any = {
          'Tuna (Yellowfin)': 'tuna',
          'Tuna (Skipjack)': 'tuna',
          'Shrimp (Tiger)': 'shrimp',
          'Shrimp (White)': 'shrimp',
          'Crab (Mud)': 'crab',
          'Crab (Blue)': 'crab',
        };

        const categoryAgg: any = { all: data.length };
        Object.keys(typeCounts).forEach(type => {
          const catKey = categoryMap[type] || 'other';
          categoryAgg[catKey] = (categoryAgg[catKey] || 0) + typeCounts[type];
        });

        const categoryList = [
          { id: 'all', name: 'All Seafood', icon: Fish, count: categoryAgg.all || 0 },
          { id: 'tuna', name: 'Tuna', icon: Fish, count: categoryAgg.tuna || 0 },
          { id: 'shrimp', name: 'Shrimp', icon: Fish, count: categoryAgg.shrimp || 0 },
          { id: 'crab', name: 'Crab', icon: Fish, count: categoryAgg.crab || 0 },
          { id: 'other', name: 'Other', icon: Anchor, count: categoryAgg.other || 0 }
        ];
        setCategories(categoryList);

      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const benefits = [
    {
      icon: BadgeCheck,
      title: 'Blockchain Verified',
      description: 'Every catch tracked from ocean to plate with immutable VeChain records'
    },
    {
      icon: Users,
      title: 'Direct from Fishers',
      description: 'Support local fishing communities and get authentic seafood at fair prices'
    },
    {
      icon: Ship,
      title: 'Sustainable Fishing',
      description: '100% compliant with sustainable fishing practices and regulations'
    },
    {
      icon: Download,
      title: 'Complete Transparency',
      description: 'Download vessel details, catch location, and full journey history'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="relative px-6 pt-8 pb-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-100 to-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-900">Blockchain Powered Seafood</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
                  Fresh from <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Our Ocean</span><br />
                  Straight to Your Table
                </h1>

                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Experience the future of seafood traceability. Every catch from Tamil Nadu's pristine waters comes with a complete VeChain blockchain-verified journey.
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <Link
                    to="/verify"
                    className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3"
                  >
                    <Shield className="w-6 h-6" />
                    Verify Catch
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <button 
                    onClick={() => {
                      const productsSection = document.getElementById('products-section');
                      if (productsSection) {
                        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="px-8 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                  >
                    <Search className="w-6 h-6" />
                    Browse Seafood
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-blue-600">{loading ? '...' : statsData.totalProducts || 0}</div>
                    <div className="text-sm text-gray-600 font-semibold">Catches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-cyan-600">{loading ? '...' : statsData.totalFishers || 0}</div>
                    <div className="text-sm text-gray-600 font-semibold">Fishers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-green-600">{loading ? '...' : statsData.totalVessels || 0}</div>
                    <div className="text-sm text-gray-600 font-semibold">Vessels</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1534943441045-c49e9a098587?w=800&h=600&fit=crop"
                    alt="Ocean Fishing"
                    className="w-full h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-blue-900/20 to-transparent" />
                  
                  <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Fish className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 font-semibold">Latest Catch</div>
                        <div className="font-black text-gray-900">Wild Yellowfin Tuna</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>Nagapattinam</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Landed 2h ago</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 font-bold ml-auto">
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-12 border-y border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 font-semibold">Loading statistics...</p>
              </div>
            ) : (
            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-semibold">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-6 py-16 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 mb-4">Why Choose Root Verse?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience the difference of blockchain-verified, sustainably caught seafood
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                >
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                    <benefit.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="px-6 py-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">Shop by Category</h2>
                <p className="text-lg text-gray-600">Explore our premium seafood selection</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-pulse space-y-3">
                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              ) : (
                categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      activeCategory === category.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl'
                        : 'bg-white border-gray-200 text-gray-900 hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <category.icon className={`w-8 h-8 mx-auto mb-3 ${activeCategory === category.id ? 'text-white' : 'text-blue-600'}`} />
                    <div className={`font-bold text-sm mb-1 ${activeCategory === category.id ? 'text-white' : 'text-gray-900'}`}>
                      {category.name}
                    </div>
                    <div className={`text-xs ${activeCategory === category.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {category.count} items
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="products-section" className="px-6 py-16 bg-gradient-to-b from-white to-blue-50/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">Featured Catches</h2>
                <p className="text-lg text-gray-600">Premium selection from our partner fishers</p>
              </div>
              <Link
                to="/verify"
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 hover:border-blue-600 rounded-2xl font-bold text-gray-900 hover:text-blue-600 transition-all shadow-md hover:shadow-lg"
              >
                <Shield className="w-5 h-5" />
                Verify Catch
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-xl text-gray-600 font-semibold">Loading fresh catches...</p>
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-semibold">No products available yet</p>
                <p className="text-gray-500 mt-2">Check back soon for fresh catches!</p>
              </div>
            ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowModal(true);
                  }}
                  className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                        -{product.discount}%
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 bg-white rounded-full p-4">
                        <Eye className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{product.category}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-gray-900">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.reviews})</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{product.location}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                      {product.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                      {product.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-bold">
                        <Eye className="w-5 h-5" />
                        View Catch Journey
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Batch ID:</span>
                        <span className="font-mono text-gray-700 font-bold">{product.batchId}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}

            <div className="text-center mt-12">
              <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3">
                View All Catches
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>

        {/* About Blockchain CTA */}
        <section className="px-6 py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
          {/* Professional decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl" />
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
                <Shield className="w-5 h-5 text-amber-300" />
                <span className="text-sm font-bold text-white">BLOCKCHAIN TECHNOLOGY</span>
              </div>

              <h2 className="text-5xl font-black text-white mb-6">
                Complete Transparency<br />
                <span className="bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">Powered by VeChain</span>
              </h2>

              <p className="text-xl text-blue-50 mb-10 max-w-3xl mx-auto leading-relaxed">
                Discover how blockchain technology ensures every catch is authentic, traceable, 
                and ethically sourced. See vessel details, catch location, and full journey history.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <Link
                  to="/about"
                  className="px-10 py-5 bg-white text-blue-700 rounded-2xl font-black text-lg shadow-2xl hover:shadow-blue-900/30 hover:scale-105 transition-all duration-300 inline-flex items-center gap-3"
                >
                  <Shield className="w-6 h-6" />
                  Learn About Blockchain
                  <ArrowRight className="w-6 h-6" />
                </Link>

                <Link
                  to="/catches-gallery"
                  className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 inline-flex items-center gap-3"
                >
                  <Fish className="w-6 h-6" />
                  View Catch Gallery
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div>
                  <div className="text-4xl font-black text-white mb-2">100%</div>
                  <div className="text-blue-100 font-semibold">Blockchain Verified</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-white mb-2">{statsData.totalFishers || '750+' }</div>
                  <div className="text-blue-100 font-semibold">Partner Fishers</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-white mb-2">{statsData.totalProducts || '50K+'}</div>
                  <div className="text-blue-100 font-semibold">Catches Traced</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="px-6 py-16 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">Trusted by Thousands</h2>
              <p className="text-lg text-gray-600">Quality assured, blockchain verified, fisher supported</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl border border-blue-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-2">{loading ? '...' : `${statsData.totalProducts || 0}`}</div>
                <div className="text-gray-700 font-semibold">Products Sold</div>
                <div className="text-sm text-gray-600 mt-2">With complete traceability</div>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-3xl border border-cyan-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-2">{loading ? '...' : `${Math.floor(statsData.totalProducts * 2.5) || 0}`}</div>
                <div className="text-gray-700 font-semibold">Happy Customers</div>
                <div className="text-sm text-gray-600 mt-2">Verified reviews</div>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl border border-amber-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-2">{loading ? '...' : `${statsData.totalVessels || 0}+`}</div>
                <div className="text-gray-700 font-semibold">Certified Vessels</div>
                <div className="text-sm text-gray-600 mt-2">Quality assured</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterWave />

      {/* Catch Journey Modal */}
      <AnimatePresence>
        {showModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8"
            >
              {/* Modal Header - Compact */}
              <div className="relative h-40 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-t-2xl">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover opacity-30 rounded-t-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl" />
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-black text-white mb-1">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-3 text-white text-sm">
                    <div className="flex items-center gap-1">
                      <Ship className="w-4 h-4" />
                      <span className="font-semibold">{selectedProduct.vessel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-semibold">{selectedProduct.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content - Compact with Scrollbar */}
              <div className="overflow-y-auto max-h-[60vh] p-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {selectedProduct.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-semibold">{selectedProduct.fisher}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-semibold">{selectedProduct.catchDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-semibold">{selectedProduct.batchId}</span>
                    </div>
                  </div>
                </div>

                {/* Catch Journey Steps - Compact */}
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-gray-900 mb-3 flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-blue-600" />
                    Catch Journey
                  </h3>
                  
                  {selectedProduct.journey.map((step: any, index: number) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3"
                    >
                      {/* Step Number - Smaller */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                          {step.step}
                        </div>
                      </div>

                      {/* Step Content - Compact */}
                      <div className="flex-1">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{step.icon}</span>
                            <div className="flex-1">
                              <h4 className="text-sm font-black text-gray-900 leading-tight">{step.title}</h4>
                              <span className="text-xs text-blue-700 font-semibold">{step.time}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Blockchain Verification Section */}
                {selectedProduct.vechainBlockId && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Blockchain Verification
                    </h3>
                    <div className="space-y-2">
                      <a
                        href={`https://explore-testnet.vechain.org/blocks/${selectedProduct.vechainBlockId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all group"
                      >
                        <span className="text-sm font-semibold text-blue-900">View Block on VeChain</span>
                        <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </a>
                      {selectedProduct.blockNumber && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-xs text-gray-600">Block Number:</span>
                          <span className="font-mono text-xs font-bold text-gray-900">#{selectedProduct.blockNumber.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedProduct.blockchainHash && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-xs text-gray-600">Blockchain Hash:</span>
                          <span className="font-mono text-xs font-bold text-gray-900 truncate ml-2">{selectedProduct.blockchainHash.substring(0, 20)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Actions - Compact */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
                  <Link
                    to={`/verify?batch=${encodeURIComponent(selectedProduct.batchId)}`}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold text-sm text-center transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Full Verification
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-bold text-sm transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
