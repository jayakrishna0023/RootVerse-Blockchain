import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import VesselMap from '../components/VesselMap';
import { fisherAPI, productAPI } from '../services/api-simple';
import ReviewForm from '../components/ReviewForm';
import { User, authService } from '../services/auth';
import { Anchor, MapPin, Package, Star, Shield, User as UserIcon } from 'lucide-react';

interface Profile {
  fisher_id: string;
  full_name: string;
  bio?: string;
  years_experience?: number;
  certifications?: string[];
  home_port_latitude?: number;
  home_port_longitude?: number;
  vessel_capacity_tons?: number;
  average_rating?: number;
  total_reviews?: number;
}

interface StoredReview { rating: number; title?: string; text: string; created_at: string; }

export default function FisherProfilePage() {
  const { fisherId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [history, setHistory] = useState<any | null>(null);
  const currentUser: User | null = authService.getCurrentUser();

  const storageKey = `fisher_reviews:${fisherId}`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Try API first
        const p = await fisherAPI.getProfile(fisherId!);
        if (mounted) setProfile(p as any);
      } catch {
        // Fallback: derive minimal profile from local storage / auth
  const fisherName = currentUser && currentUser.id === fisherId ? currentUser.full_name : 'Fisher';
        const meta = localStorage.getItem('fisher_profile_'+fisherId);
        const metaObj = meta ? JSON.parse(meta) : {};
        if (mounted) setProfile({ fisher_id: fisherId!, full_name: fisherName, ...metaObj });
      }
      try {
        const r = localStorage.getItem(storageKey);
        if (mounted) setReviews(r ? JSON.parse(r) : []);
      } catch {}
      try {
        const h = await fisherAPI.getHistory(fisherId!);
        if (mounted) setHistory(h);
      } catch {}
      try {
        const all = await productAPI.getAll();
        const cnt = all.filter(p => (p.fisher_id || '') === fisherId || (!p.fisher_id && currentUser?.full_name && p.fisher_name === currentUser.full_name)).length;
        const filtered = all.filter(p => (p.fisher_id || '') === fisherId || (!p.fisher_id && currentUser?.full_name && p.fisher_name === currentUser.full_name));
        if (mounted) {
          setProductsCount(cnt);
          setProductsList(filtered.slice(0, 10));
        }
      } catch {}
    })();
    return () => { mounted = false; }
  }, [fisherId]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((a,b)=>a+b.rating,0)/reviews.length) * 10)/10;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-blue-900">Fisher Profile</h1>
          <Link to="/" className="inline-flex items-center px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100">Home</Link>
        </div>

        {!profile ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl">Loading…</div>
        ) : (
          <div className="space-y-8">
            {/* Header card */}
            <div className="rounded-2xl border border-blue-200 p-6 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <UserIcon className="w-7 h-7 text-blue-900" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-blue-900">{profile.full_name}</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800"><Shield className="w-3 h-3 mr-1"/> Verified Fisher</span>
                  </div>
                  <p className="text-blue-900/80 font-semibold mt-1">{history?.biography || profile.bio || 'No biography available.'}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-blue-900/80 font-semibold">
                    {history?.since ? (
                      <span>Fishing since {history.since}</span>
                    ) : (
                      profile.years_experience && <span>{profile.years_experience} years experience</span>
                    )}
                    <span className="inline-flex items-center"><Package className="w-4 h-4 mr-1"/> {productsCount} catches</span>
                    {typeof profile.average_rating === 'number' && (
                      <span className="inline-flex items-center"><Star className="w-4 h-4 mr-1 text-amber-500"/> {avgRating || profile.average_rating} / 5</span>
                    )}
                    <Link to={`/fishers/${encodeURIComponent(profile.fisher_id)}/catches`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800">View catches</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Map and certifications */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-blue-200 p-6 bg-white md:col-span-2">
                <h3 className="font-black text-blue-900 mb-3 flex items-center"><MapPin className="w-4 h-4 mr-2"/> Home Port</h3>
                {(profile.home_port_latitude && profile.home_port_longitude) ? (
                  <>
                    <div className="text-blue-900 font-bold mb-4">
                      {profile.home_port_latitude}, {profile.home_port_longitude}
                      {profile.vessel_capacity_tons && <span className="ml-3 text-blue-900/80">• Capacity: <span className="font-bold text-blue-900">{profile.vessel_capacity_tons} tons</span></span>}
                    </div>
                    <div className="h-64 rounded-xl overflow-hidden">
                      <VesselMap 
                        latitude={profile.home_port_latitude} 
                        longitude={profile.home_port_longitude}
                        vesselName={profile.full_name}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-blue-900/70">Coordinates not available</div>
                )}
              </div>

              <div className="rounded-2xl border border-blue-200 p-6 bg-white">
                <h3 className="font-black text-blue-900 mb-3 flex items-center"><Anchor className="w-4 h-4 mr-2"/> Certifications</h3>
                {profile.certifications?.length ? (
                  <ul className="list-disc list-inside text-blue-900/80 font-semibold">
                    {profile.certifications.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                ) : (
                  <div className="text-blue-900/70">No certifications available.</div>
                )}
              </div>
            </div>

            {/* Vessel & Gear details (from history) */}
            {history?.vessel && (
              <div className="rounded-2xl border border-blue-200 p-6 bg-white">
                <h3 className="text-xl font-black text-blue-900 mb-4">Vessel & Gear</h3>
                <div className="grid md:grid-cols-3 gap-4 text-blue-900">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-semibold">Vessel Name</div>
                    <div className="font-mono text-sm">{history.vessel.name}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-semibold">Registration</div>
                    <div className="font-mono text-sm">{history.vessel.registration}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-semibold">Capacity</div>
                    <div className="font-bold">{history.vessel.capacity} tons</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-semibold">Gear Type</div>
                    <div className="font-bold">{history.vessel.gearType}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-semibold">Crew Size</div>
                    <div className="font-bold">{history.vessel.crewSize}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Previous catches */}
            {history?.previousCatches?.length ? (
              <div className="rounded-2xl border border-blue-200 p-6 bg-white">
                <h3 className="text-xl font-black text-blue-900 mb-4">Catch history</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {history.previousCatches.map((y: any, i: number) => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-blue-200">
                      <div className="text-sm text-blue-900/70 font-semibold">{y.date}</div>
                      <div className="font-black text-blue-900">{y.species}</div>
                      <div className="text-blue-900 font-semibold">{y.amountKg} kg</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Gear usage */}
            {history?.gearUsed?.length ? (
              <div className="rounded-2xl border border-blue-200 p-6 bg-white">
                <h3 className="text-xl font-black text-blue-900 mb-4">Gear used</h3>
                <ul className="space-y-2">
                  {history.gearUsed.map((i: any, idx: number) => (
                    <li key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-mono text-xs mr-2">{i.date}</span>
                      <span className="font-bold text-blue-900">{i.type}</span>: <span className="font-semibold">{i.name}</span> ({i.qty})
                      {i.notes ? <span className="text-blue-900/80"> — {i.notes}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Weather logs */}
            {history?.weatherLogs?.length ? (
              <div className="rounded-2xl border border-blue-200 p-6 bg-white">
                <h3 className="text-xl font-black text-blue-900 mb-4">Weather logs</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {history.weatherLogs.map((w: any, idx: number) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="font-semibold text-blue-900">{w.month}</div>
                      <div className="text-blue-900/80 text-sm">Temp: {w.temp}</div>
                      <div className="text-blue-900/80 text-sm">Wind: {w.wind}</div>
                      <div className="text-blue-900/80 text-sm">Sea State: {w.seaState}</div>
                      {w.notes && <div className="text-blue-900 font-semibold">{w.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Timeline */}
            {history?.timeline?.length ? (
              <div className="rounded-2xl border border-blue-200 p-6 bg-white">
                <h3 className="text-xl font-black text-blue-900 mb-4">Fishing timeline</h3>
                <ul className="space-y-2">
                  {history.timeline.map((t: any, idx: number) => (
                    <li key={idx} className="p-3 bg-white rounded-lg border border-blue-200">
                      <span className="font-mono text-xs mr-2">{t.date}</span>
                      <span className="font-bold text-blue-900">{t.event}</span>
                      {t.details && <span className="text-blue-900/80"> — {t.details}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Products & Reviews */}
            <div className="rounded-2xl border border-blue-200 p-6 bg-white">
              <h3 className="font-black text-blue-900 mb-3">Catches</h3>
              {productsList.length ? (
                <ul className="space-y-2 mb-4">
                  {productsList.map((p, i) => (
                    <li key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-900">{p.product_name}</div>
                        <div className="text-blue-900/80 text-sm">Batch: {p.batch_id}</div>
                      </div>
                      <div>
                        <Link to={`/verify?batch=${encodeURIComponent(p.batch_id)}`} className="text-blue-700 font-semibold">View</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-blue-900/80 mb-4">No catches to show here.</div>
              )}
              <h3 className="text-xl font-black text-blue-900 mb-4">Reviews</h3>
              {reviews.length ? (
                <div className="space-y-3 mb-6">
                  {reviews.map((r, i) => (
                    <div key={i} className="p-4 border border-blue-200 rounded-xl bg-blue-50/50">
                      <div className="flex items-center gap-2 text-blue-900">
                        <Star className="w-4 h-4 text-amber-500"/><span className="font-bold">{r.rating}/5</span>
                        {r.title && <span className="font-semibold">• {r.title}</span>}
                      </div>
                      <div className="text-blue-900/80">{r.text}</div>
                      <div className="text-xs text-blue-900/60 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-900/80 mb-4">No reviews yet.</p>
              )}
              <ReviewForm fisherId={fisherId!} onNewReview={setReviews} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
