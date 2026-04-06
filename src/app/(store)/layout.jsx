import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import BottomNav from '@/components/BottomNav/BottomNav';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import Cart from '@/components/Cart/Cart';
import PushPrompt from '@/components/Notifications/PushPrompt';

export default function StoreLayout({ children }) {
  return (
    <>
      <Navbar />
      <Cart />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <WhatsAppButton />
      <PushPrompt />
    </>
  );
}
