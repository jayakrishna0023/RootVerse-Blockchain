import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Package,
  Search,
  X,
  Users,
  CheckCircle,
  Anchor
} from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import { storyAPI, Story } from '../services/api-simple';

interface FisherProfile {
  fisher_id: string;
  name: string;
  location: string;
  phone?: string;
  email?: string;
  experience_years?: number;
  vessel_capacity?: string;
  sustainability_certified?: boolean;
  specialization?: string;
  community?: string;
  fishing_methods?: string;
  certifications?: string[];
  bio?: string;
  avatar?: string;
}

const FisherStoriesPage: React.FC = () => {
  const formatFixed = (value?: number, digits = 0) => (
    Number.isFinite(value ?? NaN) ? Number(value).toFixed(digits) : Number(0).toFixed(digits)
  );

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fisherProfiles: Record<string, FisherProfile> = {
    'fisher1@example.com': {
      fisher_id: 'fisher1@example.com',
      name: 'Ravi Kumar',
      location: 'Chennai, Tamil Nadu',
      experience_years: 25,
      vessel_capacity: '5 tons',
      sustainability_certified: true,
      specialization: 'Deep Sea Fishing',
      community: 'Pattinapakkam',
      fishing_methods: 'Traditional Line Fishing',
      bio: 'Third-generation fisher dedicated to sustainable ocean practices.',
      avatar: 'https://i.pravatar.cc/150?img=12'
    }
  };

  useEffect(() => {
    loadAllStories();
  }, []);

  useEffect(() => {
    if (!showDetailModal) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [showDetailModal]);

  const loadAllStories = async () => {
    setLoading(true);
    try {
      const allStories = await storyAPI.listPublic(60);
      setStories(allStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Failed to load fisher stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueSpecies = Array.from(new Set(stories.map(p => p.species).filter(Boolean))).sort();

  const filteredStories = stories.filter(story => {
    const matchesSearch = 
      searchQuery === '' ||
      story.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getFisherProfile(story.fisher_id)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecies = filterSpecies === 'all' || story.species === filterSpecies;
    const matchesQuality = filterQuality === 'all' || story.quality_grade === filterQuality;

    return matchesSearch && matchesSpecies && matchesQuality;
  });

  const getFisherProfile = (fisherId: string): FisherProfile => {
    return fisherProfiles[fisherId] || {
      fisher_id: fisherId,
      name: 'Anonymous Fisher',
      location: 'Coastal Region',
      sustainability_certified: false
    };
  };

  const openStoryDetail = (story: Story) => {
    setSelectedStory(story);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-900 mx-auto mb-4"></div>
            <p className="text-xl font-bold text-blue-900">Loading fisher stories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white transition-all font-semibold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl p-8 md:p-12 border-2 border-blue-900">
            <div className="inline-block px-4 py-1.5 bg-blue-900 text-white text-xs font-bold tracking-widest mb-4">
              FISHER STORIES
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-900 mb-3 leading-tight">
              Catch Stories from the Sea
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-blue-900/80 leading-relaxed max-w-2xl mb-6 sm:mb-8">
              Authentic stories from traditional fishers. Sustainable practices, fresh catches, ocean life.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2 text-blue-900">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-xl sm:text-2xl font-black">{Object.keys(fisherProfiles).length}</div>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-blue-900/70">Fishers</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2 text-blue-900">
                  <Package className="w-5 h-5" />
                  <div className="text-2xl font-black">{stories.length}</div>
                </div>
                <div className="text-sm font-semibold text-blue-900/70">Stories</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2 text-blue-900">
                  <Package className="w-5 h-5" />
                  <div className="text-2xl font-black">
                    {formatFixed(stories.reduce((sum, s) => sum + (s.weight_kg || 0), 0))}
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-900/70">Total KG</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2 text-blue-900">
                  <CheckCircle className="w-5 h-5" />
                  <div className="text-2xl font-black">100%</div>
                </div>
                <div className="text-sm font-semibold text-blue-900/70">Sustainable</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 sm:mb-8 bg-white rounded-xl p-4 sm:p-5 border border-blue-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-blue-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 outline-none transition-all font-medium text-blue-900 placeholder-blue-300"
              />
            </div>
            <select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
              className="px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 outline-none transition-all font-medium bg-white text-blue-900"
            >
              <option value="all">All Species</option>
              {uniqueSpecies.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/10 outline-none transition-all font-medium bg-white text-blue-900"
            >
              <option value="all">All Grades</option>
              <option value="Premium">Premium</option>
              <option value="Grade A">Grade A</option>
              <option value="Grade B">Grade B</option>
            </select>
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-blue-200">
            <Anchor className="w-16 h-16 mx-auto mb-4 text-blue-200" />
            <h3 className="text-2xl font-black text-blue-900 mb-2">No Stories Found</h3>
            <p className="text-blue-900/70">Check back soon for more catch stories!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStories.map((story) => {
              const fisher = getFisherProfile(story.fisher_id);
              return (
                <div
                  key={story.id}
                  className="group bg-white rounded-xl border-2 border-blue-200 hover:border-blue-900 overflow-hidden transition-all cursor-pointer"
                  onClick={() => openStoryDetail(story)}
                >
                  {story.cover_image_url && (
                    <div className="h-48 w-full overflow-hidden bg-blue-50">
                      <img 
                        src={story.cover_image_url} 
                        alt={story.species || 'cover'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Fisher */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={fisher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fisher.name)}&background=000&color=fff`}
                        alt={fisher.name}
                        className="w-12 h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-blue-900 truncate">{fisher.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-blue-900/70">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{fisher.location}</span>
                        </div>
                      </div>
                      {fisher.sustainability_certified && (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 text-blue-900" />
                      )}
                    </div>

                    {/* Species */}
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-blue-900 mb-1">{story.species}</h3>
                      {story.quality_grade && (
                        <span className="inline-block px-2 py-0.5 bg-blue-900 text-white text-xs font-bold rounded">
                          {story.quality_grade}
                        </span>
                      )}
                    </div>

                    {/* Catch Weight */}
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-900">{story.weight_kg}</div>
                        <div className="text-sm font-semibold text-blue-900/70">kg caught</div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      {story.catch_date && (
                        <div className="flex items-center gap-1.5 text-blue-900/80">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium truncate">{new Date(story.catch_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {story.catch_month && (
                        <div className="font-medium text-blue-900/80 truncate">{story.catch_month}</div>
                      )}
                    </div>

                    {/* Story Preview */}
                    {story.content && (
                      <p className="text-sm text-blue-900/70 line-clamp-2 mb-4">{story.content}</p>
                    )}

                    {/* View Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openStoryDetail(story); }}
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-sm transition-all"
                    >
                      VIEW FULL STORY
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {showDetailModal && selectedStory && (
        <div
          onClick={() => setShowDetailModal(false)}
          className="fixed inset-0 bg-blue-900/80 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-3xl my-4 sm:my-8 max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b-2 border-blue-100 p-4 sm:p-6 relative">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 hover:bg-blue-100 rounded-full flex items-center justify-center transition-colors z-10 text-blue-900"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {(() => {
                const fisher = getFisherProfile(selectedStory.fisher_id);
                return (
                  <div className="flex items-start gap-4 pr-12">
                    <img
                      src={fisher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fisher.name)}&background=000&color=fff`}
                      alt={fisher.name}
                      className="w-16 h-16 rounded-full border-2 border-blue-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-black text-blue-900">{fisher.name}</h2>
                        {fisher.sustainability_certified && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-900 text-white text-xs font-bold rounded">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            SUSTAINABLE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-900/70 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{fisher.location}</span>
                      </div>
                      {fisher.bio && (
                        <p className="text-sm text-blue-900/70">{fisher.bio}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-3xl font-black text-blue-900 mb-2">{selectedStory.species}</h3>
                {selectedStory.quality_grade && (
                  <span className="inline-block px-3 py-1 bg-blue-900 text-white text-sm font-bold rounded">
                    {selectedStory.quality_grade}
                  </span>
                )}
              </div>

              {/* Catch Weight */}
              <div className="mb-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200 text-center">
                <div className="text-5xl font-black text-blue-900 mb-1">{selectedStory.weight_kg}</div>
                <div className="text-base font-bold text-blue-900/70">KG CAUGHT</div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                {selectedStory.catch_date && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-bold text-blue-900/70 mb-1">Catch Date</div>
                    <div className="font-semibold text-blue-900">{new Date(selectedStory.catch_date).toLocaleDateString()}</div>
                  </div>
                )}
                
                {selectedStory.content && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-bold text-blue-900/70 mb-2">Story</div>
                    <p className="text-blue-900 leading-relaxed">{selectedStory.content}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t-2 border-blue-100 p-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FisherStoriesPage;
