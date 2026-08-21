import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StoreProvider } from './lib/store.jsx';
import { WishlistProvider } from './lib/wishlist.jsx';
import { ToastProvider } from './lib/toast.jsx';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { Home } from './pages/Home.jsx';
import { Catalog } from './pages/Catalog.jsx';
import { Product } from './pages/Product.jsx';
import { Wishlist } from './pages/Wishlist.jsx';
import { NotFound } from './pages/NotFound.jsx';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <WishlistProvider>
        <ToastProvider>
          <HashRouter>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pt-[72px]">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product" element={<Product />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </HashRouter>
        </ToastProvider>
      </WishlistProvider>
    </StoreProvider>
  );
}
