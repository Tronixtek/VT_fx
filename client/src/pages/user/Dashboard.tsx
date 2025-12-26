import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { TrendingUp, BookOpen, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);

  const hasSubscription = user?.subscription.status === 'active';

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">Welcome, {user?.name}!</h1>

      {/* Subscription Status */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Subscription Status</h2>
        {hasSubscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="bg-accent-green text-white px-4 py-2 rounded-lg w-fit text-sm sm:text-base">
              Active
            </div>
            <div>
              <p className="font-semibold capitalize text-sm sm:text-base">{user.subscription.plan} Plan</p>
              <p className="text-xs sm:text-sm text-gray-600">
                Expires: {new Date(user.subscription.endDate!).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">No active subscription</p>
            <Link
              to="/pricing"
              className="inline-block bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition text-sm sm:text-base"
            >
              Subscribe Now
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          to="/dashboard/signals"
          className="bg-white rounded-lg shadow p-5 sm:p-6 hover:shadow-lg transition"
        >
          <TrendingUp size={40} className="text-primary mb-3 sm:mb-4 sm:w-12 sm:h-12" />
          <h3 className="text-lg sm:text-xl font-bold">Trading Signals</h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-2">View real-time signals</p>
        </Link>

        <Link
          to="/dashboard/courses"
          className="bg-white rounded-lg shadow p-5 sm:p-6 hover:shadow-lg transition"
        >
          <BookOpen size={40} className="text-primary mb-3 sm:mb-4 sm:w-12 sm:h-12" />
          <h3 className="text-lg sm:text-xl font-bold">Courses</h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-2">Learn trading strategies</p>
        </Link>

        <Link
          to="/dashboard/mentorship"
          className="bg-white rounded-lg shadow p-5 sm:p-6 hover:shadow-lg transition"
        >
          <Users size={40} className="text-primary mb-3 sm:mb-4 sm:w-12 sm:h-12" />
          <h3 className="text-lg sm:text-xl font-bold">Mentorship</h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-2">Book 1-on-1 sessions</p>
        </Link>

        <a
          href={import.meta.env.VITE_DERIV_URL || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-lg shadow p-5 sm:p-6 hover:shadow-lg transition"
        >
          <Calendar size={40} className="text-primary mb-3 sm:mb-4 sm:w-12 sm:h-12" />
          <h3 className="text-lg sm:text-xl font-bold">Trade on Deriv</h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-2">Start trading now</p>
        </a>
      </div>
    </div>
  );
}
