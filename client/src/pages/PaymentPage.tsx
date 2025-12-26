import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const plans = [
  {
    name: 'Basic',
    price: 10000,
    currency: '₦',
    features: ['10 signals per month', 'Basic market analysis', 'Email support', 'Trading guides'],
  },
  {
    name: 'Pro',
    price: 25000,
    currency: '₦',
    features: ['50 signals per month', 'Advanced analysis', 'Priority support', 'All courses access', 'Weekly webinars'],
    popular: true,
  },
  {
    name: 'Premium',
    price: 50000,
    currency: '₦',
    features: ['Unlimited signals', 'Real-time alerts', '24/7 support', 'All courses & resources', '1-on-1 mentorship', 'Private Discord'],
  },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const [selectedPlan, setSelectedPlan] = useState(planParam || 'Pro');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const { data } = await api.post('/payments/initialize', {
        plan: selectedPlan.toLowerCase(),
      });

      // Redirect to Paystack payment page
      window.location.href = data.data.authorizationUrl;
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 text-lg">
            Select the perfect plan for your trading journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative cursor-pointer transition-all hover:shadow-xl ${
                selectedPlan === plan.name
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.name)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">₦{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>You will be redirected to Paystack for secure payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Selected Plan:</span>
              <Badge variant="default">{selectedPlan}</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="font-medium">Amount:</span>
              <span className="text-2xl font-bold text-primary">
                ₦{plans.find((p) => p.name === selectedPlan)?.price.toLocaleString()}
              </span>
            </div>
            <div className="pt-4">
              <Button
                className="w-full py-6 text-lg"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Initializing Payment...' : 'Proceed to Payment'}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Secured by Paystack • Cancel anytime
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>
      </div>
    </div>
  );
}
