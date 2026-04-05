const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    purchasePrice: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
        // This will store either the local path (legacy) or Cloudinary URL (new)
    },
    category: {
        type: [String],
        required: true
    },
    material: {
        type: String,
        default: ''
    },
    stock: {
        type: Number,
        default: 0
    },
    vendor: {
        type: String,
        default: 'Bilal Bhai'
    },
    isCustomizable: {
        type: Boolean,
        default: false
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    colors: {
        type: [String],
        default: []
    },
    slug: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for search performance if needed, 
// though simplistic regex/atlas search might be better for this scale.
// Text index for search
productSchema.index({ title: 'text', description: 'text', category: 'text' });

// Performance indexes for common filters and sorts
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
// Slug index is already created by unique: true in schema

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
