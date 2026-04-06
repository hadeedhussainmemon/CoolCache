import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import Order from '../../../../../lib/models/Order';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/orders/stats/summary
export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    // Basic Counts
    const countsPipeline = [
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ];
    const countsAgg = await Order.aggregate(countsPipeline);
    const counts = { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };

    countsAgg.forEach(row => {
      if (row._id) counts[row._id] = row.count;
      counts.total += row.count;
    });

    // Revenue Aggregation
    const revenuePipeline = [
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ];

    // Profit & Margin Aggregation
    const financialsPipeline = [
      { $match: { status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: 'id',
          as: 'productDetails'
        }
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          revenue: { $multiply: ['$items.price', '$items.quantity'] },
          cost: { $multiply: [{ $ifNull: ['$productDetails.purchasePrice', 0] }, '$items.quantity'] }
        }
      },
      {
        $group: {
          _id: null,
          grossProfit: { $sum: { $subtract: ['$revenue', '$cost'] } }
        }
      }
    ];

    const [financials, revenueAgg] = await Promise.all([
      Order.aggregate(financialsPipeline),
      Order.aggregate(revenuePipeline)
    ]);

    const totalProfit = financials[0]?.grossProfit || 0;
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    // Monthly Sales
    const monthlyPipeline = [
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 12 }
    ];
    const monthlyAgg = await Order.aggregate(monthlyPipeline);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlySales = monthlyAgg.map(item => {
      const [year, month] = item._id.split('-');
      return {
        name: monthNames[parseInt(month) - 1],
        fullDate: item._id,
        value: item.revenue
      };
    });

    return NextResponse.json({
      ...counts,
      totalRevenue,
      totalProfit,
      monthlySales,
      _source: 'db'
    });
  } catch (error) {
    console.error('API Order Stats error:', error);
    return NextResponse.json({ message: 'Error fetching statistics', error: error.message }, { status: 500 });
  }
}
