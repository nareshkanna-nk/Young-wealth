import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-navy-700">
          <TrendingUp className="w-6 h-6" />
          Young Wealth
        </Link>
        <nav>
          <ul className="flex items-center gap-6">
            {/* Show navigation items only for authenticated users */}
            {isAuthenticated && (
              <li>
                <Link 
                  to="/learning" 
                  className={`hover:text-teal-600 transition-colors ${
                    location.pathname === '/learning' ? 'text-teal-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  Learn
                </Link>
              </li>
            )}
            
            {/* Show Expense Tracker for college students */}
            {user?.role === 'college-student' && (
              <li>
                <Link 
                  to="/expense-tracker" 
                  className={`hover:text-teal-600 transition-colors ${
                    location.pathname === '/expense-tracker' ? 'text-teal-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  Expense Tracker
                </Link>
              </li>
            )}
            
            {/* Show Payment for all except admin */}
            {isAuthenticated && user?.role !== 'admin' && (
              <li>
                <Link 
                  to="/payment" 
                  className={`hover:text-teal-600 transition-colors ${
                    location.pathname === '/payment' ? 'text-teal-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  Payment
                </Link>
              </li>
            )}
            
            {/* Dashboard links by role */}
            {user?.role === 'admin' ? (
              <li>
                <Link 
                  to="/admin/dashboard" 
                  className={`hover:text-teal-600 transition-colors ${
                    location.pathname.startsWith('/admin') ? 'text-teal-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  Admin Dashboard
                </Link>
              </li>
            ) : isAuthenticated && user ? (
              <li>
                <Link 
                  to={`/dashboard/${user.role.replace('-student', '')}`} 
                  className={`hover:text-teal-600 transition-colors ${
                    location.pathname.startsWith('/dashboard') ? 'text-teal-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
              </li>
            )}
            
            {isAuthenticated ? (
              <>
                <li>
                  <span className="text-gray-600 text-sm">
                    Welcome, {user?.fullName}
                  </span>
                </li>
                <li>
                  <button 
                    onClick={logout} 
                    className="flex items-center gap-1 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut />
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  to="/login" 
                  className={`hover:text-teal-600 transition-colors ${
                    location.pathname === '/login' ? 'text-teal-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};