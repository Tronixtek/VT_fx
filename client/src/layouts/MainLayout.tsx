import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-dark-navy text-white py-4 px-4 sm:px-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">VTfx</h1>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-4 lg:gap-6">
            <a href="/" className="hover:text-primary transition">Home</a>
            <a href="/pricing" className="hover:text-primary transition">Pricing</a>
            <a href="/login" className="hover:text-primary transition">Login</a>
            <a href="/register" className="hover:text-primary transition">Register</a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-primary/20 rounded-lg transition"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700 pt-4">
            <div className="flex flex-col gap-3">
              <a
                href="/"
                className="hover:text-primary transition px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/pricing"
                className="hover:text-primary transition px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="/login"
                className="hover:text-primary transition px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </a>
              <a
                href="/register"
                className="hover:text-primary transition px-2 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register
              </a>
            </div>
          </div>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
