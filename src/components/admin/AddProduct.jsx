import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Save, AlertCircle } from 'lucide-react';
import getImageUrl from '../../utils/imageUrl';

function AddProduct({ onClose, onProductAdded, product = null, existingCategories = [] }) {
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        purchasePrice: '0',
        description: '',
        material: '',
        stock: '',
        isCustomizable: false,
        isVisible: true,
        colors: ''
    });

    // Category State
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    const isEditing = !!product;

    useEffect(() => {
        if (product) {
            setFormData({
                title: product.title || '',
                price: product.price || '',
                purchasePrice: product.purchasePrice || '0',
                description: product.description || '',
                material: product.material || '',
                stock: product.stock || '',
                isCustomizable: product.isCustomizable || false,
                isVisible: product.isVisible !== undefined ? product.isVisible : true,
                colors: Array.isArray(product.colors) ? product.colors.join(', ') : (product.colors || '')
            });

            // Handle Categories
            if (Array.isArray(product.category)) {
                setSelectedCategories(product.category);
            } else if (typeof product.category === 'string') {
                setSelectedCategories(product.category.split(',').map(c => c.trim()).filter(Boolean));
            }

            // Handle existing image for preview
            if (product.image) {
                setImagePreview(getImageUrl(product.image));
            }
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryToggle = (cat) => {
        setSelectedCategories(prev => {
            if (prev.includes(cat)) {
                return prev.filter(c => c !== cat);
            } else {
                return [...prev, cat];
            }
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size must be less than 10MB');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!imageFile && !isEditing) {
                throw new Error('Please select an image');
            }

            // Combine selected categories and new category
            let finalCategories = [...selectedCategories];
            if (newCategory.trim()) {
                const newCats = newCategory.split(',').map(c => c.trim()).filter(Boolean);
                finalCategories = [...new Set([...finalCategories, ...newCats])]; // Unique
            }

            if (finalCategories.length === 0) {
                throw new Error('Please select or add at least one category');
            }

            const data = new FormData();
            data.append('title', formData.title);
            data.append('price', formData.price);
            data.append('purchasePrice', formData.purchasePrice);
            data.append('description', formData.description);
            // Backend expects comma-separated string for category
            data.append('category', finalCategories.join(','));
            data.append('material', formData.material);
            data.append('stock', formData.stock);
            data.append('isCustomizable', formData.isCustomizable);
            data.append('isVisible', formData.isVisible);
            data.append('colors', formData.colors);

            if (imageFile) {
                data.append('image', imageFile);
            }

            const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

            const url = isEditing
                ? `${API_BASE_URL}/api/products/${product.id}`
                : `${API_BASE_URL}/api/products`;

            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Failed to ${isEditing ? 'update' : 'add'} product`);
            }

            const savedProduct = await response.json();
            onProductAdded && onProductAdded(savedProduct);
            onClose && onClose();
        } catch (err) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} product:`, err);
            setError(err.message || `Error occurred while ${isEditing ? 'updating' : 'adding'} product`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {imagePreview ? (
                                        <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-sm font-medium">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-gray-500">
                                            <Upload className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                                            <p className="text-sm">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    placeholder="Product Name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                                    <input
                                        type="number"
                                        name="purchasePrice"
                                        min="0"
                                        value={formData.purchasePrice}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="Qty"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 mb-2">
                                        {existingCategories.map(cat => (
                                            <div key={cat} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`cat-${cat}`}
                                                    checked={selectedCategories.includes(cat)}
                                                    onChange={() => handleCategoryToggle(cat)}
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <label htmlFor={`cat-${cat}`} className="text-sm text-gray-700 cursor-pointer select-none">
                                                    {cat}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="+ Add New"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            required
                            rows={6}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all min-h-[120px] resize-y"
                            placeholder="Product description..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                            <input
                                type="text"
                                name="material"
                                value={formData.material}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                placeholder="e.g. Leather, Steel"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma separated)</label>
                            <input
                                type="text"
                                name="colors"
                                value={formData.colors}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                placeholder="e.g. Red, Blue, Black"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isCustomizable"
                            name="isCustomizable"
                            checked={formData.isCustomizable}
                            onChange={handleChange}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="isCustomizable" className="text-sm font-medium text-gray-700">This product is customizable</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isVisible"
                            name="isVisible"
                            checked={formData.isVisible}
                            onChange={handleChange}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="isVisible" className="text-sm font-medium text-gray-700">Visible on Website</label>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {isEditing ? 'Saving...' : 'Adding...'}
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {isEditing ? 'Save Changes' : 'Add Product'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProduct;
