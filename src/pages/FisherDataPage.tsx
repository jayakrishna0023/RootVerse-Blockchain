import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Plus, Calendar, Package, Edit2, Trash2, Search, 
  ChevronLeft, ChevronRight, Download, TrendingUp, Award, 
  Anchor, SortAsc, SortDesc, Grid3x3, List, Fish, Blocks, Hash
} from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import { fisherDataAPI, FisherData, productAPI, Product } from '../services/api-simple';
import { authService } from '../services/auth';
import { apiCache } from '../services/apiCache';

const FisherDataPage: React.FC = () => {
  const formatFixed = (value?: number, digits = 0) => (
    Number.isFinite(value ?? NaN) ? Number(value).toFixed(digits) : Number(0).toFixed(digits)
  );

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [records, setRecords] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'date' | 'weight' | 'species'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const pageSize = 12;
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const stableId = (user as any).fisher_id || user.id || user.email;
      loadRecords(stableId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadRecords = async (fisherId: string) => {
    setLoading(true);
    try {
      // Use productAPI to fetch products (catches) instead of stories
      const list = await apiCache.get(`fisher-products:${fisherId}`, () => 
        productAPI.listByFisher(fisherId)
      );
      setRecords(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      window.dispatchEvent(new CustomEvent('page:ready'));
    } catch (error) {
      console.error('Failed to load fisher data:', error);
      toast.error('Failed to load records');
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id: string) => {
    // Products cannot be deleted easily via API yet, maybe disable delete or implement delete in productAPI
    if (!confirm('Delete this record permanently?')) return;
    toast.error('Deletion not supported for blockchain records');
  };

  const uniqueSpecies = Array.from(new Set(records.map(p => p.product_name).filter(Boolean))).sort();
  const uniqueQualities = Array.from(new Set(records.map(p => p.quality_grade).filter(Boolean))).sort();

  const filtered = records.filter(record => {
    const matchesSearch = 
      searchQuery === '' ||
      record.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.batch_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.vessel_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || record.product_name === filterSpecies;
    const matchesQuality = filterQuality === 'all' || record.quality_grade === filterQuality;
    return matchesSearch && matchesSpecies && matchesQuality;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
      case 'weight':
        comparison = (a.weight || 0) - (b.weight || 0);
        break;
      case 'species':
        comparison = (a.product_name || '').localeCompare(b.product_name || '');
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginatedRecords = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSpecies, filterQuality, sortField, sortDirection]);

  const exportCSV = () => {
    try {
      const rows = [['Batch ID', 'Species', 'Vessel', 'Weight(kg)', 'Quality', 'Catch Date', 'Created']];
      filtered.forEach((p) => {
        rows.push([
          p.batch_id || '', p.product_name || '', p.vessel_name || '',
          String(p.weight ?? ''), p.quality_grade || '',
          p.catch_date ? new Date(p.catch_date).toLocaleDateString() : '',
          p.created_at || ''
        ]);
      });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fisher-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const toggleSort = (field: 'date' | 'weight' | 'species') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <SiteHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-xl font-bold text-blue-900">Loading records...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'fisher') {
    return (
      <div className="min-h-screen bg-blue-50">
        <SiteHeader />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="bg-white rounded-2xl p-12 shadow-sm border-2 border-blue-900">
            <h2 className="text-3xl font-black text-blue-900 mb-4">
              {!currentUser ? 'Login Required' : 'Fishers Only'}
            </h2>
            <p className="text-blue-700 mb-8 text-lg">
              {!currentUser ? 'Please log in to access catch records.' : 'This page is for recording catch data.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link 
                to={!currentUser ? "/login" : "/fisher/catches"}
                className="px-8 py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
              >
                {!currentUser ? 'Login' : 'View Gallery'}
              </Link>
              <Link 
                to={!currentUser ? "/" : "/dashboard"}
                className="px-8 py-3 bg-white text-blue-900 rounded-lg font-bold border-2 border-blue-300 hover:border-blue-900 transition-colors"
              >
                {!currentUser ? 'Go Home' : 'Dashboard'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-200 text-blue-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Back</span>
            </Link>
            <button
              onClick={() => navigate('/fisher/data/new')}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>New Catch</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-900 p-4 sm:p-6 md:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-900 mb-2">Catch Records</h1>
                <p className="text-blue-600 text-sm sm:text-base md:text-lg">Comprehensive catch data management</p>
              </div>
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-blue-900 flex-shrink-0" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <Package className="w-8 h-8 text-blue-900" />
                  <div className="text-right">
                    <div className="text-4xl font-black text-blue-900">{records.length}</div>
                    <div className="text-sm font-bold text-blue-600 mt-1">Total Records</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-8 h-8 text-blue-900" />
                  <div className="text-right">
                    <div className="text-4xl font-black text-blue-900">
                      {formatFixed(records.reduce((sum, r) => sum + (r.weight || 0), 0))}
                    </div>
                    <div className="text-sm font-bold text-blue-600 mt-1">Total Weight (kg)</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-8 h-8 text-blue-900" />
                  <div className="text-right">
                    <div className="text-4xl font-black text-blue-900">{uniqueSpecies.length}</div>
                    <div className="text-sm font-bold text-blue-600 mt-1">Species Types</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-blue-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-4">
            <div className="sm:col-span-2 lg:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                placeholder="Search species, batch ID, or vessel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all font-medium text-blue-900 placeholder-blue-300"
              />
            </div>
            
            <div className="lg:col-span-2">
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none bg-white font-semibold text-sm sm:text-base text-blue-900"
              >
                <option value="all">All Species</option>
                {uniqueSpecies.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={filterQuality}
                onChange={(e) => setFilterQuality(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none bg-white font-semibold text-sm sm:text-base text-blue-900"
              >
                <option value="all">All Grades</option>
                {uniqueQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 p-2.5 rounded-lg font-bold transition-all ${viewMode === 'grid' ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              >
                <Grid3x3 className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 p-2.5 rounded-lg font-bold transition-all ${viewMode === 'list' ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              >
                <List className="w-5 h-5 mx-auto" />
              </button>
            </div>
            
            <div className="sm:col-span-2 lg:col-span-2">
              <button
                onClick={exportCSV}
                disabled={filtered.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-blue-700">Sort:</span>
            {[
              { field: 'date' as const, label: 'Date', icon: Calendar },
              { field: 'weight' as const, label: 'Weight', icon: TrendingUp },
              { field: 'species' as const, label: 'Species', icon: Fish }
            ].map(({ field, label, icon: Icon }) => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
                  sortField === field
                    ? 'bg-blue-900 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {sortField === field && (
                  sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Records Display */}
        {paginatedRecords.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-900 p-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-blue-300" />
            <h3 className="text-2xl font-black text-blue-900 mb-3">No Records Found</h3>
            <p className="text-blue-600 mb-6 text-lg">
              {searchQuery || filterSpecies !== 'all' || filterQuality !== 'all' ? 'Try adjusting your filters' : 'Start by creating your first catch record'}
            </p>
            {!searchQuery && filterSpecies === 'all' && filterQuality === 'all' && (
              <button
                onClick={() => navigate('/fisher/data/new')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Catch
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg border-2 border-blue-200 hover:border-blue-900 overflow-hidden transition-all"
                >
                  {/* Card Header */}
                  <div className="bg-blue-900 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white mb-2">{record.product_name || 'Unknown Species'}</h3>
                        {record.quality_grade && (
                          <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full border border-white/30">
                            {record.quality_grade}
                          </span>
                        )}
                      </div>
                      <Award className="w-8 h-8 text-white/80" />
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-4xl font-black text-white mb-1">{record.weight || 0}</div>
                      <div className="text-sm font-bold text-white/80">kg caught</div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      {record.batch_id && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-blue-500">Batch ID</div>
                            <div className="font-bold text-blue-900 truncate" title={record.batch_id}>{record.batch_id}</div>
                          </div>
                        </div>
                      )}

                      {record.vessel_name && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Anchor className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-blue-500">Vessel</div>
                            <div className="font-bold text-blue-900 truncate">{record.vessel_name}</div>
                            {(record as any).vessel_id && (
                              <div className="text-xs text-blue-400 truncate" title={(record as any).vessel_id}>ID: {(record as any).vessel_id}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {record.blockchain_hash && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Hash className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-blue-500">Blockchain Hash</div>
                            <div className="font-bold text-blue-900 truncate" title={record.blockchain_hash}>
                              {record.blockchain_hash.substring(0, 10)}...{record.blockchain_hash.substring(record.blockchain_hash.length - 8)}
                            </div>
                          </div>
                        </div>
                      )}

                      {record.block_number && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Blocks className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-blue-500">Block Number</div>
                            <div className="font-bold text-blue-900">#{record.block_number}</div>
                          </div>
                        </div>
                      )}

                      {record.catch_date && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-blue-500">Catch Date</div>
                            <div className="font-bold text-blue-900">{new Date(record.catch_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}

                      {record.created_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-blue-500">Created</div>
                            <div className="font-bold text-blue-900">{new Date(record.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/verify?batch=${record.batch_id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
                      >
                        <Award className="w-4 h-4" />
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 overflow-hidden mb-8">
            <div className="divide-y-2 divide-blue-100">
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-6 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <Fish className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <h3 className="text-lg font-black text-blue-900 mb-1">{record.product_name || 'Unknown'}</h3>
                        {record.quality_grade && (
                          <span className="inline-block px-2 py-0.5 bg-blue-900 text-white text-xs font-bold rounded">
                            {record.quality_grade}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-blue-500 mb-1">Batch ID</div>
                        <div className="font-bold text-blue-900 truncate" title={record.batch_id}>{record.batch_id || 'N/A'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-blue-500 mb-1">Vessel</div>
                        <div className="font-bold text-blue-900 truncate">{record.vessel_name || 'N/A'}</div>
                        {(record as any).vessel_id && <div className="text-xs text-blue-400 truncate" title={(record as any).vessel_id}>{(record as any).vessel_id}</div>}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-blue-500 mb-1">Blockchain</div>
                        <div className="font-bold text-blue-900 truncate" title={record.blockchain_hash || 'Pending'}>
                          {record.blockchain_hash ? `${record.blockchain_hash.substring(0, 6)}...` : 'Pending'}
                        </div>
                        {record.block_number && <div className="text-xs text-blue-400">Block #{record.block_number}</div>}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-blue-500 mb-1">Weight</div>
                        <div className="text-2xl font-black text-blue-900">{record.weight || 0} kg</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-blue-500 mb-1">Created</div>
                        <div className="font-bold text-blue-900">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/verify?batch=${record.batch_id}`)}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl shadow-sm border-2 border-blue-200 px-4 sm:px-6 py-4 gap-4">
            <div className="text-xs sm:text-sm font-bold text-blue-700 text-center sm:text-left">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white border-2 border-blue-200 rounded-lg font-bold hover:bg-blue-50 hover:border-blue-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-blue-200 text-sm sm:text-base text-blue-900"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </button>
              
              <div className="px-4 sm:px-6 py-2 bg-blue-900 text-white rounded-lg font-black text-sm sm:text-base whitespace-nowrap">
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white border-2 border-blue-200 rounded-lg font-bold hover:bg-blue-50 hover:border-blue-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-blue-200 text-sm sm:text-base text-blue-900"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FisherDataPage;
