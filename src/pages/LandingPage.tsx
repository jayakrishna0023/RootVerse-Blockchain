import { Link } from 'react-router-dom';
import { Users, ArrowRight, Globe, QrCode, Activity, Box, Lock, Shield, Play, CheckCircle2 } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';

export default function LandingPage() {
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 100]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-600 selection:text-white overflow-x-hidden text-slate-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BrandLogo variant="dark" />
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            {['Verify', 'Solutions', 'Company'].map((item) => (
              <Link 
                key={item}
                to={`/${item.toLowerCase()}`} 
                className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors tracking-wide"
              >
                {item.toUpperCase()}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors">
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 bg-slate-950 text-white rounded-lg font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-600/20 transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 px-6 overflow-hidden">
        {/* Premium Background Gradient */}
        <div className="absolute top-0 inset-x-0 h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                </span>
                Live on VeChain Mainnet
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-950 tracking-tight mb-8 leading-[1.05]">
                Trust. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Verified.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-slate-700 max-w-xl mb-12 leading-relaxed font-medium">
                The enterprise blockchain standard for the seafood industry. We turn supply chain data into consumer trust.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 hover:-translate-y-1"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/verify"
                  className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-800 hover:text-indigo-600 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  Verify Product
                </Link>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-16 pt-8 border-t border-slate-100 flex items-center gap-8">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center overflow-hidden shadow-md">
                       <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 text-amber-400 fill-amber-400"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>)}
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Trusted by <span className="text-indigo-600">500+</span> enterprises.
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visual - Premium Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform rotate-[-1deg] hover:rotate-0 transition-transform duration-700">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Batch</div>
                      <div className="text-slate-900 font-bold">#BATCH-8921</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Verified
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-sm text-slate-500 font-bold mb-2">Total Volume</div>
                      <div className="text-3xl font-black text-slate-900">2,405 <span className="text-lg text-slate-400 font-medium">kg</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="text-sm text-slate-500 font-bold mb-2">Temperature</div>
                      <div className="text-3xl font-black text-slate-900">-18.2 <span className="text-lg text-slate-400 font-medium">°C</span></div>
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 font-bold mb-6 uppercase tracking-wider">Supply Chain Journey</div>
                    <div className="space-y-6 relative">
                      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                      {[
                        { title: 'Catch Registered', time: '04:20 AM', active: true },
                        { title: 'Processing Facility', time: '09:15 AM', active: true },
                        { title: 'Quality Check', time: '11:30 AM', active: true },
                        { title: 'In Transit', time: 'In Progress', active: false },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-4 relative z-10">
                          <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${step.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {step.active ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-3 h-3 bg-slate-300 rounded-full"></div>}
                          </div>
                          <div>
                            <div className={`font-bold ${step.active ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</div>
                            <div className="text-xs text-slate-500 font-medium">{step.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid - Premium Cards */}
      <div className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4">Why Root Verse?</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Enterprise Grade. Consumer Ready.</h3>
            <p className="text-xl text-slate-700 max-w-2xl mx-auto font-medium">
              We combine cutting-edge blockchain technology with intuitive design to make traceability effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Box, title: 'Batch Traceability', desc: 'Track catch batches from vessel to processing facility with granular precision.' },
              { icon: Lock, title: 'Immutable Records', desc: 'Every data point is hashed and stored on VeChain, creating a tamper-proof history.' },
              { icon: Globe, title: 'Global Compliance', desc: 'Automated reporting for FAO, NOAA, and EU regulatory standards.' },
              { icon: Activity, title: 'IoT Integration', desc: 'Connect directly with vessel sensors for automated temperature and location logging.' },
              { icon: Users, title: 'Stakeholder Access', desc: 'Permissioned access for distributors, retailers, and auditors.' },
              { icon: QrCode, title: 'Consumer Engagement', desc: 'Generate dynamic QR codes that tell the story of sustainability to end customers.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-10 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-indigo-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors duration-300">
                  <feature.icon className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h4>
                <p className="text-slate-700 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Video / Story Section - High Contrast */}
      <div className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 opacity-30 mix-blend-overlay">
               <img src="https://images.unsplash.com/photo-1534943441045-c49e9a098587?w=1600&q=80" alt="Ocean" className="w-full h-full object-cover grayscale" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent"></div>
            
            <div className="relative z-10 p-12 md:p-24 grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">See the journey from <br/><span className="text-indigo-400">ocean to plate.</span></h3>
                <p className="text-lg text-slate-300 mb-10 leading-relaxed font-medium">
                  Discover how Root Verse empowers fishers and consumers alike by bringing transparency to the seafood supply chain.
                </p>
                <button className="flex items-center gap-6 group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-white/10">
                    <Play className="w-8 h-8 text-slate-950 fill-slate-950 ml-1" />
                  </div>
                  <span className="text-white font-bold text-xl group-hover:text-indigo-400 transition-colors">Watch the Film</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA - Premium Dark */}
      <div className="py-32 px-6 bg-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to modernize your supply chain?</h2>
          <p className="text-xl text-indigo-200 mb-12 max-w-2xl mx-auto font-medium">
            Join the network of sustainable fisheries and distributors using Root Verse to build trust.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/signup"
              className="px-12 py-5 bg-white text-indigo-950 rounded-xl font-black text-xl hover:bg-indigo-50 transition-all shadow-2xl hover:scale-105"
            >
              Get Started Now
            </Link>
            <Link
              to="/contact"
              className="px-12 py-5 bg-transparent border-2 border-indigo-800 text-white rounded-xl font-bold text-xl hover:bg-indigo-900 hover:border-indigo-700 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <BrandLogo variant="dark" />
            <div className="flex gap-10 text-sm font-bold text-slate-600">
              <Link to="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-indigo-600 transition-colors">Contact Support</Link>
            </div>
            <div className="text-slate-500 text-sm font-medium">
              © 2025 Root Verse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
