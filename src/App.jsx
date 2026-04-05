import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar/Navbar';
import PageSkeleton from './components/Skeletons/PageSkeleton';
import ProductDetailSkeleton from './components/Skeletons/ProductDetailSkeleton';
import Cart from './components/Cart/Cart';
import ProtectedRoute from './components/Admin/ProtectedRoute';
import SEO from './components/SEO/SEO';
import SortToTop from './components/utility/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';
import ErrorBoundary from './components/Errors/ErrorBoundary';
import './index.css';

// Lazy loaded pages & components
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductDetail = lazy(() => import('./components/ProductDetail/ProductDetail'));
const CategoryPage = lazy(() => import('./components/Category/CategoryPage'));
const SearchPage = lazy(() => import('./components/Search/SearchPage'));
const Wishlist = lazy(() => import('./components/Wishlist/Wishlist'));
const OrderTracking = lazy(() => import('./components/OrderTracking/OrderTracking'));
const MyOrders = lazy(() => import('./components/MyOrders/MyOrders'));
const Checkout = lazy(() => import('./components/Checkout/CheckoutForm'));
const OrderSuccess = lazy(() => import('./components/Checkout/OrderSuccess'));
const AdminLogin = lazy(() => import('./components/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const InstallPage = lazy(() => import('./components/PWA/InstallPage'));
const NotFound = lazy(() => import('./components/Errors/NotFound'));

// Other lazy components used in Layout
const BottomNav = lazy(() => import('./components/BottomNav/BottomNav'));
const PushPrompt = lazy(() => import('./components/Notifications/PushPrompt'));
const AllCategories = lazy(() => import('./components/AllCategories/AllCategories'));
const AllRecommendations = lazy(() => import('./components/AllRecommendations/AllRecommendations'));
const FAQ = lazy(() => import('./components/FAQ/FAQ'));
const Footer = lazy(() => import('./components/Footer/Footer'));

const Toast = lazy(() => import('./components/Toast/Toast'));
import { useCart } from './context/CartContext';
import { Toaster } from 'sonner';

const PageLayout = ({ children }) => (
	<>
		<Navbar />
		{/* Cart is hoisted to AppContent */}
		{children}
		<Suspense fallback={null}><Footer /></Suspense>
		<Suspense fallback={null}><BottomNav /></Suspense>
		<WhatsAppButton />
		<Suspense fallback={null}><PushPrompt /></Suspense>
	</>
);

function AppContent() {
	const { toast, hideToast } = useCart();
	return (
		<ErrorBoundary>
			<Suspense fallback={null}>
				{/* Legacy Toast removed - handled by Sonner Toaster in App root */}
			</Suspense>

			{/* Cart hoisted here for persistence */}
			<Cart />

			<Routes>
				<Route path="/" element={
					<Suspense fallback={<PageSkeleton />}>
						<HomePage />
					</Suspense>
				} />

				<Route
					path="/categories"
					element={(
						<PageLayout>
							<Suspense fallback={<PageSkeleton />}>
								<AllCategories />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/search"
					element={(
						<PageLayout>
							<Suspense fallback={<PageSkeleton />}>
								<SearchPage />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/recommendations"
					element={(
						<PageLayout>
							<Suspense fallback={<PageSkeleton />}>
								<AllRecommendations />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/faq"
					element={(
						<PageLayout>
							<SEO
								title="FAQ | CoolCache Pakistan"
								description="Answers to common questions about orders, payments, delivery, returns, customization, and open‑box delivery in Karachi."
								canonical="https://www.coolcache.app/faq"
							/>
							<Suspense fallback={<PageSkeleton />}>
								<FAQ />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/category/:category"
					element={(
						<PageLayout>
							<Suspense fallback={<PageSkeleton />}>
								<CategoryPage />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/product/:idOrSlug"
					element={(
						<PageLayout>
							<Suspense fallback={<ProductDetailSkeleton />}>
								<ErrorBoundary>
									<ProductDetail />
								</ErrorBoundary>
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/wishlist"
					element={(
						<PageLayout>
							<Suspense fallback={<PageSkeleton />}>
								<Wishlist />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/track-order"
					element={(
						<PageLayout>
							<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center text-gray-600">Loading...</div></div>}>
								<OrderTracking />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/track-order/:orderId"
					element={(
						<PageLayout>
							<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center text-gray-600">Loading...</div></div>}>
								<OrderTracking />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/my-orders"
					element={(
						<PageLayout>
							<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center text-gray-600">Loading...</div></div>}>
								<MyOrders />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/orders"
					element={(
						<PageLayout>
							<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center text-gray-600">Loading...</div></div>}>
								<Checkout />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/order-success"
					element={(
						<PageLayout>
							<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center text-gray-600">Loading...</div></div>}>
								<OrderSuccess />
							</Suspense>
						</PageLayout>
					)}
				/>

				<Route
					path="/admin"
					element={(
						<Suspense fallback={<div className="p-8 text-center text-gray-600">Loading...</div>}>
							<AdminLogin onLogin={() => { }} />
						</Suspense>
					)}
				/>

				<Route
					path="/admin/login"
					element={(
						<Suspense fallback={<div className="p-8 text-center text-gray-600">Loading...</div>}>
							<AdminLogin onLogin={() => { }} />
						</Suspense>
					)}
				/>

				<Route
					path="/admin/dashboard"
					element={(
						<ProtectedRoute>
							<Suspense fallback={<div className="p-8 text-center text-gray-600">Loading...</div>}>
								<ErrorBoundary>
									<AdminDashboard />
								</ErrorBoundary>
							</Suspense>
						</ProtectedRoute>
					)}
				/>

				<Route
					path="/install"
					element={(
						<Suspense fallback={<div className="min-h-screen bg-purple-600 flex items-center justify-center text-white">Loading...</div>}>
							<InstallPage />
						</Suspense>
					)}
				/>

				<Route path="*" element={
					<PageLayout>
						<Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
							<NotFound />
						</Suspense>
					</PageLayout>
				} />
			</Routes>
		</ErrorBoundary>
	);
}

function App() {
	return (
		<CartProvider>
			<WishlistProvider>
				<SortToTop behavior="auto" />
				<Toaster richColors position="bottom-right" closeButton theme="light" />
				<AppContent />
			</WishlistProvider>
		</CartProvider>
	);
}

export default App;
