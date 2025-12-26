import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dark-navy to-primary text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Master Trading with VTfx</h1>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-200">
            Real-time signals, expert education, and personalized mentorship
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto sm:max-w-none">
            <Link
              to="/register"
              className="bg-accent-green hover:bg-accent-green/90 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition text-center"
            >
              Get Started
            </Link>
            <Link
              to="/pricing"
              className="bg-white text-dark-navy hover:bg-gray-100 px-6 sm:px-8 py-3 rounded-lg font-semibold transition text-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">Why Choose VTfx?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
              <TrendingUp size={40} className="text-primary mb-4 sm:w-12 sm:h-12" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Real-Time Signals</h3>
              <p className="text-gray-600">
                Get instant trading signals from expert analysts delivered in real-time via our platform.
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
              <BookOpen size={40} className="text-primary mb-4 sm:w-12 sm:h-12" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Expert Education</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Access comprehensive video courses covering forex, crypto, and technical analysis.
              </p>
            </div>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
              <Users size={40} className="text-primary mb-4 sm:w-12 sm:h-12" />
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">1-on-1 Mentorship</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Book personalized sessions with professional traders for tailored guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-white py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Ready to Start Trading?</h2>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-gray-100 px-6 sm:px-8 py-3 rounded-lg font-semibold transition"
          >
            Create Account <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
