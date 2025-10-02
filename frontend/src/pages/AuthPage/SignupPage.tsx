import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
    } catch (err: any) {
      const errors = err.response?.data;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(' ');
        setError(errorMessages || 'Signup failed. Please try again.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen  bg-transparent">
      <div className="w-full max-w-md p-8 space-y-6 bg-transparent border border-gray-700 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-green-500 ">
          Create your LinkChat Account
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Add fields for username, email, password */}
          <div>
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-100"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border text-yellow-500 placeholder-gray-400 border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-100"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter your email"
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border text-yellow-500 border-gray-300 placeholder-gray-400 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-100"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border text-yellow-500 border-gray-300 placeholder-gray-400 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-400"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;