const SimulatorPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">
        {/* Icon */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Trading Simulator
        </h1>
        
        {/* Coming Soon Badge */}
        <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold mb-6">
          Coming Soon
        </div>

        {/* Description */}
        <p className="text-xl text-gray-400 mb-8">
          We're building an advanced trading simulator with realistic market conditions, 
          technical analysis tools, and real-time price action.
        </p>

        {/* Features List */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">What to Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-medium">100+ Trading Instruments</h3>
                <p className="text-gray-400 text-sm">Forex, Crypto, Commodities & Indices</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-medium">Advanced Charting</h3>
                <p className="text-gray-400 text-sm">Drawing tools & technical indicators</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-medium">Risk Management Rules</h3>
                <p className="text-gray-400 text-sm">Enforced daily limits & cooldowns</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-medium">Performance Analytics</h3>
                <p className="text-gray-400 text-sm">Track your progress & statistics</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <p className="text-gray-500">
          Stay tuned for updates. We'll notify you when the simulator goes live!
        </p>
      </div>
    </div>
  );
};

export default SimulatorPage;
