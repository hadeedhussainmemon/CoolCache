import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, EyeOff, Edit2, Trash2, Package, Plus } from 'lucide-react';
import getImageUrl from '../../utils/imageUrl';
import AddProduct from './AddProduct';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const itemsPerPage = 10;

  // API Base URL
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/products?pageSize=1000&showHidden=true` : '/api/products?pageSize=1000&showHidden=true';
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const productList = Array.isArray(data) ? data : data.products || [];
      setProducts(productList);

      // Extract unique categories
      const allCategories = new Set();
      productList.forEach(p => {
        if (Array.isArray(p.category)) {
          p.category.forEach(cat => allCategories.add(cat));
        } else if (typeof p.category === 'string') {
          allCategories.add(p.category);
        }
      });
      setCategories(Array.from(allCategories).filter(Boolean).sort());
    } catch (error) {
      console.error('Error fetching products:', error);
      // alert('Failed to load products. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [API_BASE_URL]);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.id?.toString().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p =>
        (Array.isArray(p.category) && p.category.includes(selectedCategory)) ||
        p.category === selectedCategory
      );
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(p => (p.price || 0) >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(p => (p.price || 0) <= Number(maxPrice));
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, products]);

  // Reset pagination only when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, minPrice, maxPrice]);

  // Calculate profit
  const calculateProfit = (product) => {
    const sellingPrice = product.price || 0;
    const purchasePrice = product.purchasePrice || 0;
    return sellingPrice - purchasePrice;
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Product ID', 'Product Name', 'Purchase Price', 'Selling Price', 'Profit', 'Category', 'Stock'];
    const rows = filteredProducts.map(p => [
      p.id,
      p.title,
      p.purchasePrice || 0,
      p.price || 0,
      calculateProfit(p),
      (Array.isArray(p.category) ? p.category.join('; ') : p.category),
      p.stock || 0
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    window.URL.revokeObjectURL(url);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete product');
      }

      // Refresh list
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !product.isVisible })
      });

      if (!response.ok) throw new Error('Failed to update visibility');

      // Optimistic update or refetch
      const updated = await response.json();
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to update visibility');
    }
  };

  const handleProductAdded = (newProduct) => {
    // Optionally insert directly to avoid refetch, but refetching ensures consistency
    fetchProducts();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">All Products</h2>
            <p className="text-sm sm:text-base text-slate-300 flex items-center gap-2">
              <Package size={18} className="text-violet-400" />
              Manage and analyze your product inventory
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsAddModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl hover:bg-gray-100 transition-all text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus size={20} className="text-violet-600" />
              <span>Add Product</span>
            </button>
            <button
              onClick={exportToCSV}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-bold shadow-lg hover:shadow-2xl hover:scale-105"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-5 sm:p-6 lg:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Search size={16} className="text-violet-600" />
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all hover:border-gray-300"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Filter size={16} className="text-violet-600" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all hover:border-gray-300 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all hover:border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all hover:border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs sm:text-sm text-gray-600">
            Showing <strong className="text-gray-900">{paginatedProducts.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-gray-900">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</strong> of{' '}
            <strong className="text-gray-900">{filteredProducts.length}</strong> products
          </span>
          {(selectedCategory || searchQuery || minPrice || maxPrice) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="text-violet-600 hover:text-violet-700 font-semibold text-xs sm:text-sm flex items-center gap-1 hover:underline"
            >
              <span>✕ Clear all filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-600"></div>
            </div>
            <p className="mt-6 text-base sm:text-lg font-semibold text-slate-700">Loading products...</p>
            <p className="mt-2 text-sm text-slate-500">Please wait while we fetch your inventory</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Package size={40} className="text-violet-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">No products found</p>
              <p className="text-sm sm:text-base text-slate-600">Try adjusting your search or filters to find what you're looking for</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700">Picture</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700">Product Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700">Purchase Price</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700">Selling Price</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700">Profit</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700">Stock</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProducts.map((product) => {
                    const profit = calculateProfit(product);
                    const isLowStock = product.stock < 10;
                    const isSoldOut = product.stock === 0;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        {/* Picture */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img
                                src={getImageUrl(product.image, { width: 100, crop: 'fill' })}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"%3E%3Crect width="24" height="24" fill="%23f3f4f6"/%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">No image</span>
                            )}
                          </div>
                        </td>

                        {/* Product Name */}
                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2">{product.title}</p>
                              {product.isVisible === false && (
                                <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded border border-gray-200" title="Hidden from website">Hidden</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">ID: {product.id}</p>
                          </div>
                        </td>

                        {/* Purchase Price */}
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            Rs. {(product.purchasePrice || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Selling Price */}
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            Rs. {(product.price || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Profit */}
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${profit > 0
                            ? 'bg-green-50 text-green-700'
                            : profit < 0
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50 text-gray-700'
                            }`}>
                            Rs. {profit.toLocaleString()}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isSoldOut
                            ? 'bg-red-50 text-red-700'
                            : isLowStock
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-green-50 text-green-700'
                            }`}>
                            {product.stock || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title={product.isVisible ? "Hide from website" : "Show on website"}
                              onClick={() => handleToggleVisibility(product)}
                              className={`p-2 rounded-lg transition-colors ${product.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                              {product.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button
                              title="Edit"
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
              {paginatedProducts.map((product) => {
                const profit = calculateProfit(product);
                const isLowStock = product.stock < 10;
                const isSoldOut = product.stock === 0;

                return (
                  <div key={product.id} className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all">
                    <div className="p-4">
                      <div className="flex gap-3">
                        {/* Picture */}
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                          {product.image ? (
                            <img
                              src={getImageUrl(product.image, { width: 100, crop: 'fill' })}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"%3E%3Crect width="24" height="24" fill="%23f3f4f6"/%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{product.title}</h3>
                          <p className="text-xs text-gray-500 mb-2">ID: {product.id}</p>

                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${isSoldOut
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : isLowStock
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}>
                              {product.stock || 0} in stock
                            </span>
                            {product.isVisible === false && (
                              <span className="bg-gray-100 text-gray-500 text-[10px] sm:text-xs px-2 py-0.5 rounded border border-gray-200 font-medium">Hidden</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Purchase</p>
                            <p className="font-bold text-sm text-gray-800">Rs. {(product.purchasePrice || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Selling</p>
                            <p className="font-bold text-sm text-gray-800">Rs. {(product.price || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                              Profit
                            </p>
                            <p className={`font-bold text-sm ${profit > 0 ? 'text-green-700' : profit < 0 ? 'text-red-700' : 'text-gray-800'
                              }`}>
                              Rs. {profit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                          title={product.isVisible ? "Hide from website" : "Show on website"}
                          onClick={() => handleToggleVisibility(product)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 shadow-sm hover:shadow ${product.isVisible ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                        >
                          {product.isVisible ? (
                            <>
                              <Eye size={14} />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} />
                              Hidden
                            </>
                          )}
                        </button>
                        <button
                          title="Edit"
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all flex items-center gap-1 shadow-sm hover:shadow"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm hover:shadow border border-rose-200 hover:border-rose-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t-2 border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                    <span className="text-sm text-gray-700">
                      Page <strong className="text-gray-900">{currentPage}</strong> of <strong className="text-gray-900">{totalPages}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {
        isAddModalOpen && (
          <AddProduct
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingProduct(null);
            }}
            onProductAdded={handleProductAdded}
            product={editingProduct}
            existingCategories={categories}
          />
        )
      }
    </div >
  );
}

export default AdminProducts;
