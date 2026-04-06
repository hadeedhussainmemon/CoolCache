import mongoose from 'mongoose';

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

productSchema.index({ title: 'text', description: 'text', category: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
