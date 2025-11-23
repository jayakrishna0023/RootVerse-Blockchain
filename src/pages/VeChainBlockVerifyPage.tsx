import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Search, 
  ExternalLink, 
  Activity, 
  Clock, 
  CheckCircle, 
  Hash,
  Layers,
  Globe,
  TrendingUp,
  Database
} from 'lucide-react';
import api from '../services/api-simple';
import toast from 'react-hot-toast';

interface BlockchainData {
  blockHeight: number;
  totalTransactions: number;
  networkHashRate: string;
  activeNodes: number;
  avgBlockTime: string;
  latestBlock: string;
}

interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: string;
  type: string;
  status: 'success' | 'pending' | 'failed';
  productId: string;
  fisher: string;
}

export default function VeChainBlockVerifyPage() {
  const navigate = useNavigate();
  const [searchHash, setSearchHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    blockHeight: 0,
    totalTransactions: 0,
    networkHashRate: 'Loading...',
    activeNodes: 0,
    avgBlockTime: 'Loading...',
    latestBlock: 'Loading...'
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        const response = await api.get('/api/blockchain/stats');
        if (response.data) {
          setBlockchainData({
            blockHeight: response.data.blockHeight,
            totalTransactions: response.data.totalTransactions,
            networkHashRate: response.data.networkHashRate,
            activeNodes: response.data.activeNodes,
            avgBlockTime: response.data.avgBlockTime,
            latestBlock: response.data.latestBlock
          });
          setRecentTransactions(response.data.recentTransactions);
        }
      } catch (err) {
        console.error("Failed to fetch blockchain stats:", err);
        setError("Failed to connect to blockchain network");
      }
    };

    fetchBlockchainData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchBlockchainData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHash.trim()) return;

    setLoading(true);
    try {
      // Search our backend first
      const response = await api.get(`/api/blockchain/search?q=${encodeURIComponent(searchHash.trim())}`);
      const result = response.data;

      if (result.type === 'product') {
        navigate(`/verify/${result.id}`);
        toast.success('Product found!');
      } else if (result.type === 'transaction' && result.productId) {
        navigate(`/verify/${result.productId}`);
        toast.success('Transaction found! Redirecting to product verification.');
      } else if (result.type === 'block') {
        window.open(`https://explore-testnet.vechain.org/blocks/${result.id}`, '_blank');
      } else {
        // Fallback to external explorer
        window.open(`https://explore-testnet.vechain.org/transactions/${searchHash}`, '_blank');
        toast('Searching external explorer...', { icon: '🔍' });
      }
    } catch (err) {
      console.error("Search failed:", err);
      // Fallback
      window.open(`https://explore-testnet.vechain.org/transactions/${searchHash}`, '_blank');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-800 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link 
              to="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VeChain Explorer</h1>
                <p className="text-sm text-gray-800">Blockchain verification & monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">VeChain Blockchain Explorer</h1>
          <p className="text-xl text-gray-800 max-w-2xl mx-auto">
            Monitor blockchain transactions and verify product authenticity on the VeChain network
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-8 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Blockchain Search */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction Search</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                <Hash className="w-5 h-5 inline mr-2 text-indigo-600" />
                Transaction Hash, Block Number, or Product ID
              </label>
              <input
                type="text"
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                placeholder="Enter transaction hash, block number, or product ID"
                className="w-full input border-gray-300"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search Blockchain</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setSearchHash('0x742d35cc2c5e4c2bb12ca5f8c39b7b7b8e8a2c5f4b2e1d9c8b7a6f5e4d3c2b1a')}
                className="btn btn-secondary"
              >
                Try Sample Hash
              </button>
            </div>
          </form>
        </div>

        {/* Network Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Network Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={Layers}
              title="Block Height"
              value={blockchainData.blockHeight.toLocaleString()}
              color="bg-blue-500"
            />
            <StatCard
              icon={Database}
              title="Total Transactions"
              value={blockchainData.totalTransactions.toLocaleString()}
              color="bg-blue-500"
            />
            <StatCard
              icon={TrendingUp}
              title="Network Hash Rate"
              value={blockchainData.networkHashRate}
              color="bg-purple-500"
            />
            <StatCard
              icon={Globe}
              title="Active Nodes"
              value={blockchainData.activeNodes}
              color="bg-orange-500"
            />
            <StatCard
              icon={Clock}
              title="Avg Block Time"
              value={blockchainData.avgBlockTime}
              color="bg-indigo-500"
            />
            <StatCard
              icon={Activity}
              title="Network Status"
              value="Online"
              color="bg-green-500"
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden mb-8">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Recent Blockchain Transactions</h2>
              <a
                href="https://explore-testnet.vechain.org"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-sm flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on VeChain Explorer</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Block
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 text-gray-700 mr-2" />
                        {/* Link to product verification if available, else external */}
                        {tx.productId ? (
                          <Link to={`/verify/${tx.productId}`} className="font-mono text-sm text-indigo-600 hover:underline">
                            {tx.hash.substring(0, 20)}...
                          </Link>
                        ) : (
                          <a 
                            href={`https://explore-testnet.vechain.org/transactions/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-indigo-600 hover:underline"
                          >
                            {tx.hash.substring(0, 20)}...
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{tx.blockNumber.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <Link to={`/verify/${tx.productId}`} className="text-sm font-medium text-indigo-600 hover:underline">
                          {tx.productId}
                        </Link>
                        <div className="text-sm text-gray-500">{tx.fisher}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'success' 
                          ? 'bg-blue-100 text-blue-800' 
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Block Information */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Layers className="w-6 h-6 mr-2 text-indigo-600" />
            Latest Block Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Block Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Block Number:</span>
                  <span className="font-mono text-gray-900">#{blockchainData.blockHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Block Time:</span>
                  <span className="text-gray-900">{blockchainData.avgBlockTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Nodes:</span>
                  <span className="text-gray-900">{blockchainData.activeNodes} active</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Block Hash</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-mono text-sm text-gray-900 break-all">
                  {blockchainData.latestBlock}
                </p>
              </div>
              <div className="mt-4">
                <a
                  href={`https://explore.vechain.org/blocks/${blockchainData.blockHeight}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Block on VeChain Explorer</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits removed */}
      </div>
    </div>
  );
}