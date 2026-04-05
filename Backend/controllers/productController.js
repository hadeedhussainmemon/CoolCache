const Product = require('../models/Product');
const { productSlug, slugify } = require('../utils/slug');
const { mapTokensToSlugs, mapQueryToSlugs } = require('../utils/synonyms');

class ProductController {

  // GET /api/products/trending-searches
  async getTrendingSearches(req, res) {
    try {
      // Aggregate categories from DB
      const result = await Product.aggregate([
        { $unwind: "$category" },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const terms = result.map(r => r._id)
        .filter(c => c && c.trim())
        .map(c => String(c).replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

      res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
      return res.json({ terms: terms.slice(0, 8) });
    } catch (e) {
      console.error('getTrendingSearches error:', e);
      return res.json({ terms: [] });
    }
  }

  // GET /api/products
  async getAllProducts(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = parseInt(req.query.pageSize) || 24;

      const search = (req.query.q || req.query.search || '').trim();
      const categoryParam = (req.query.categories || req.query.category || '').trim();
      const categories = categoryParam ? categoryParam.split(',').map(s => s.trim()).filter(Boolean) : [];

      const minPrice = isFinite(Number(req.query.minPrice)) ? Number(req.query.minPrice) : null;
      const maxPrice = isFinite(Number(req.query.maxPrice)) ? Number(req.query.maxPrice) : null;
      const inStock = (String(req.query.inStock).toLowerCase() === 'true' || req.query.inStock === true);

      // Default to showing only visible products, unless showHidden is explicitly requested (e.g. by admin)
      const showHidden = (String(req.query.showHidden).toLowerCase() === 'true' || req.query.showHidden === true);

      // Build Match Stage (Query)
      const matchStage = {};

      if (!showHidden) {
        matchStage.isVisible = true;
      }

      if (categories.length > 0) {
        // Case-insensitive match for categories
        const regexCats = categories.map(c => new RegExp(`^${c}$`, 'i'));
        matchStage.category = { $in: regexCats };
      }

      if (search) {
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapeRegExp(search), 'i');
        matchStage.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { material: searchRegex },
          { vendor: searchRegex },
          { category: searchRegex }
        ];
      }

      if (minPrice !== null || maxPrice !== null) {
        matchStage.price = {};
        if (minPrice !== null) matchStage.price.$gte = minPrice;
        if (maxPrice !== null) matchStage.price.$lte = maxPrice;
      }

      if (inStock) {
        matchStage.stock = { $gt: 0 };
      }

      // Determine secondary sort based on user input
      let secondarySort = { _id: -1 }; // Default fallback
      if (req.query.sort === 'priceAsc') secondarySort = { price: 1, _id: -1 };
      else if (req.query.sort === 'priceDesc') secondarySort = { price: -1, _id: -1 };
      // Note: 'featured' will rely heavily on our availability score, then stock count, then newness
      else if (req.query.sort === 'featured') secondarySort = { stock: -1, _id: -1 };

      // Aggregation Pipeline
      const pipeline = [
        { $match: matchStage },
        // Add "availabilityScore" for custom sorting
        // Priority 3: In Stock AND Price > 0
        // Priority 2: In Stock AND Price == 0 (Contact for price)
        // Priority 1: Out of Stock
        {
          $addFields: {
            availabilityScore: {
              $switch: {
                branches: [
                  {
                    case: { $and: [{ $gt: ["$stock", 0] }, { $gt: ["$price", 0] }] },
                    then: 3
                  },
                  {
                    case: { $gt: ["$stock", 0] },
                    then: 2
                  }
                ],
                default: 1
              }
            }
          }
        },
        // Sort by availability first, then the user's selected sort
        { $sort: { availabilityScore: -1, ...secondarySort } },
        // Facet for pagination
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize }
            ]
          }
        }
      ];

      const result = await Product.aggregate(pipeline);

      const metadata = result[0].metadata;
      const total = metadata.length > 0 ? metadata[0].total : 0;
      const productsData = result[0].data;

      // Transform data payload
      const payload = productsData.map(d => ({
        id: d.id,
        title: d.title,
        price: d.price,
        purchasePrice: d.purchasePrice,
        vendor: d.vendor,
        image: d.image,
        slug: d.slug,
        category: d.category,
        stock: d.stock,
        isVisible: d.isVisible,
        // material: d.material, // Optional if needed in list view
        description: (d.description && d.description.length > 120) ? `${d.description.slice(0, 120)}...` : d.description
      }));

      res.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      res.json({ products: payload, total, page, pageSize });

    } catch (error) {
      console.error('getAllProducts error:', error);
      res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
  }

  // GET /api/products/:id
  async getProductById(req, res) {
    try {
      const idOrSlug = req.params.id;
      let product;

      if (/^\d+$/.test(idOrSlug)) {
        product = await Product.findOne({ id: parseInt(idOrSlug) });
      } else {
        product = await Product.findOne({ slug: idOrSlug });
      }

      if (!product) return res.status(404).json({ message: 'Product not found' });

      res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
  }

  // GET /api/products/category/:category
  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const pageSize = parseInt(req.query.pageSize) || 24;

      const regex = new RegExp(`^${category}$`, 'i');

      // Default to visible only
      const query = { category: regex, isVisible: true };

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      const payload = products.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        description: p.description,
        image: p.image,
        slug: p.slug,
        category: p.category,
        material: p.material,
        stock: p.stock,
        isCustomizable: p.isCustomizable
      }));

      res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
      return res.json({ products: payload, total, page, pageSize });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching products by category', error: error.message });
    }
  }

  // GET /api/products/categories
  async getCategories(req, res) {
    try {
      const categories = await Product.aggregate([
        { $unwind: "$category" },
        {
          $group: {
            _id: { $toLower: "$category" },
            originalName: { $first: "$category" },
            count: { $sum: 1 },
            image: { $first: "$image" }
          }
        },
        { $sort: { originalName: 1 } }
      ]);

      const payload = categories.map(c => ({
        name: c.originalName,
        slug: String(c.originalName).toLowerCase().replace(/\s+/g, '-'),
        count: c.count,
        image: c.image || '/og-image.jpg'
      }));

      res.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
      res.json({ categories: payload });
    } catch (error) {
      console.error('getCategories error:', error);
      res.status(500).json({ categories: [] });
    }
  }

  // POST /api/products (Admin)
  async addProduct(req, res) {
    try {
      const { title, price, description, category, material, stock, isCustomizable, colors, isVisible } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'No image provided' });
      }

      const lastProduct = await Product.findOne().sort({ id: -1 });
      const nextId = (lastProduct && lastProduct.id) ? lastProduct.id + 1 : 1;

      // Cloudinary image URL from middleware
      const imageUrl = req.file.path;

      const parsedColors = typeof colors === 'string' && colors.trim().length
        ? colors.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(colors) ? colors : []);

      let categoryArray = [];
      if (typeof category === 'string') {
        categoryArray = category.split(',').map(c => c.trim()).filter(Boolean);
      } else if (Array.isArray(category)) {
        categoryArray = category;
      }

      const newProduct = new Product({
        id: nextId,
        title,
        price: parseFloat(price),
        description,
        image: imageUrl,
        category: categoryArray,
        material: material || '',
        stock: parseInt(stock) || 0,
        colors: parsedColors,

        isCustomizable: isCustomizable === 'true' || isCustomizable === true,
        isVisible: isVisible === undefined ? true : (isVisible === 'true' || isVisible === true)
      });

      newProduct.slug = productSlug(newProduct);

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('addProduct error:', error);
      res.status(500).json({ message: 'Error adding product', error: error.message });
    }
  }

  // PATCH /api/products/:id (Admin)
  async updateProduct(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { title, price, purchasePrice, description, category, material, stock, isCustomizable, colors, isVisible } = req.body;

      const product = await Product.findOne({ id });
      if (!product) return res.status(404).json({ message: 'Product not found' });

      if (title) {
        product.title = title;
        // Update slug if title changes
        product.slug = productSlug({ ...product.toObject(), title });
      }

      // Handle price updates (allow 0)
      if (price !== undefined && price !== '') {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice)) return res.status(400).json({ message: 'Invalid price value' });
        product.price = parsedPrice;
      }

      // Handle purchasePrice updates (allow 0)
      if (purchasePrice !== undefined && purchasePrice !== '') {
        const parsedPurchasePrice = parseFloat(purchasePrice);
        if (isNaN(parsedPurchasePrice)) return res.status(400).json({ message: 'Invalid purchase price value' });
        product.purchasePrice = parsedPurchasePrice;
      }

      if (description) product.description = description;

      if (category) {
        if (typeof category === 'string') {
          product.category = category.split(',').map(c => c.trim()).filter(Boolean);
        } else if (Array.isArray(category)) {
          product.category = category;
        }
      }

      if (material) product.material = material;

      // Handle stock updates (allow 0)
      if (stock !== undefined && stock !== '') {
        const parsedStock = parseInt(stock);
        if (isNaN(parsedStock)) return res.status(400).json({ message: 'Invalid stock value' });
        product.stock = parsedStock;
      }

      if (isCustomizable !== undefined) product.isCustomizable = (String(isCustomizable) === 'true');
      if (isVisible !== undefined) product.isVisible = (String(isVisible) === 'true');

      if (colors !== undefined) {
        const parsed = typeof colors === 'string' && colors.trim().length
          ? colors.split(',').map(s => s.trim()).filter(Boolean)
          : (Array.isArray(colors) ? colors : []);
        product.colors = parsed;
      }

      if (req.file) {
        product.image = req.file.path;
      }

      await product.save();
      res.json(product);
    } catch (error) {
      console.error('updateProduct error:', error);
      // Check for duplicate key error (e.g. slug collision)
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Duplicate value error', error: error.message });
      }
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  }

  // DELETE /api/products/:id (Admin)
  async deleteProduct(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await Product.findOneAndDelete({ id });

      if (!result) return res.status(404).json({ message: 'Product not found' });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ProductController;