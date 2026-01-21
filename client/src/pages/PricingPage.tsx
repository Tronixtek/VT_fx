import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPlans } from '@/redux/slices/paymentSlice';
import { RootState, AppDispatch } from '@/redux/store';
import { formatCurrency } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { plans, loading } = useSelector((state: RootState) => state.payment);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchPlans());
  }, [dispatch]);

  const handleGetStarted = (planName: string) => {
    if (user) {
      // User is logged in, redirect to payment page with selected plan
      navigate(`/payment?plan=${planName}`);
    } else {
      // User not logged in, redirect to registration
      navigate('/register');
    }
  };

  const features = {
    basic: ['Trading Signals', 'Basic Courses', 'Community Access'],
    pro: ['All Basic Features', 'Advanced Courses', 'Priority Support', '1 on 1 Mentorship Sessions'],
    premium: ['All Pro Features', 'VIP Signals', 'Unlimited Mentorship', 'Exclusive Content'],
  };

  return (
    <div className="min-h-screen py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 sm:mb-6">Choose Your Plan</h1>
        <p className="text-base sm:text-lg lg:text-xl text-center text-gray-600 mb-8 sm:mb-12">
          Start your trading journey with the perfect plan for you
        </p>

        {loading ? (
          <div className="text-center">Loading plans...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-lg p-6 sm:p-8 hover:shadow-xl transition"
              >
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 capitalize">{plan.name}</h3>
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-4 sm:mb-6">
                  {formatCurrency(plan.amount)}
                  <span className="text-base sm:text-lg text-gray-600">/month</span>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {features[plan.id as keyof typeof features]?.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check size={18} className="text-accent-green flex-shrink-0 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleGetStarted(plan.name)}
                  className="block w-full bg-primary hover:bg-primary/90 text-white text-center py-2.5 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base"
                >
                  {user ? 'Subscribe Now' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Deriv Trading Platform CTA */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 sm:p-8 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Apply Your Knowledge?</h2>
          <p className="text-base sm:text-lg mb-6 text-white/90">
            Open a free trading account on Deriv and start trading with real market conditions
          </p>
          <a
            href="https://deriv.partners/rx?sidc=C13CB916-CFD6-43C2-B467-60A54DFA3077&utm_campaign=dynamicworks&utm_medium=affiliate&utm_source=CU253171"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Open Free Deriv Account
          </a>
        </div>
      </div>
    </div>
  );
}
