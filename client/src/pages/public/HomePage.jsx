import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const HomePage = () => {
  const features = [
    {
      icon: '🔍',
      title: 'Easy Search',
      description: 'Find your perfect accommodation with our advanced search filters',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '✅',
      title: 'Verified Listings',
      description: 'All properties are verified to ensure quality and authenticity',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: '💰',
      title: 'Best Prices',
      description: 'Compare prices and find the best deals for student accommodation',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: '⭐',
      title: 'Real Reviews',
      description: 'Read genuine reviews from SLIIT students',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: '🛡️',
      title: 'Secure Platform',
      description: 'Safe and secure payment processing for your peace of mind',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: '📱',
      title: '24/7 Support',
      description: 'Get help whenever you need it with our dedicated support team',
      color: 'from-red-500 to-rose-500',
    },
  ];

  const stats = [
    { number: '500+', label: 'Verified Listings', icon: '🏠' },
    { number: '2000+', label: 'Happy Students', icon: '😊' },
    { number: '100+', label: 'Trusted Owners', icon: '🤝' },
    { number: '4.8', label: 'Average Rating', icon: '⭐' },
  ];

  const userTypes = [
    {
      title: 'For Students',
      description: 'Find your ideal accommodation near SLIIT campus',
      icon: '🎓',
      link: '/register',
      gradient: 'from-blue-600 to-cyan-600',
      features: ['Browse verified listings', 'Read reviews', 'Book instantly', 'Secure payments'],
    },
    {
      title: 'For Property Owners',
      description: 'List your property and reach SLIIT students',
      icon: '🏘️',
      link: '/register',
      gradient: 'from-purple-600 to-pink-600',
      features: [
        'Easy listing management',
        'Tenant verification',
        'Secure transactions',
        'Analytics dashboard',
      ],
    },
    {
      title: 'For Service Providers',
      description: 'Offer maintenance and support services',
      icon: '🔧',
      link: '/register',
      gradient: 'from-orange-600 to-red-600',
      features: [
        'Get service requests',
        'Manage appointments',
        'Build reputation',
        'Grow your business',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Enhanced Gradient */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white py-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-blue-400/20 to-transparent rounded-full animate-float"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-indigo-400/20 to-transparent rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
              Find Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">Perfect</span> Student Accommodation
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-blue-100 animate-fade-in-up max-w-3xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Discover quality, verified accommodations near SLIIT campus. Safe, affordable, and student-friendly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/search">
                <Button variant="primary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100 hover:shadow-glow-md transform hover:scale-105 transition-all duration-300">
                  Browse Accommodations
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 backdrop-blur-sm bg-white/10 transform hover:scale-105 transition-all duration-300">
                  List Your Property
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-white" preserveAspectRatio="none" viewBox="0 0 1440 74" fill="none">
            <path d="M0 22L60 26.7C120 31 240 41 360 44.3C480 48 600 46 720 37.3C840 29 960 15 1080 14.7C1200 15 1320 29 1380 36.3L1440 44V74H1380C1320 74 1200 74 1080 74C960 74 840 74 720 74C600 74 480 74 360 74C240 74 120 74 60 74H0V22Z" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* Stats Section with Enhanced Design */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center animate-fade-in-up group" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-5xl mb-2 animate-bounce-slow">{stat.icon}</div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced Cards */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Us?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make finding accommodation simple, safe, and stress-free
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in-up border border-gray-100"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                {/* Icon with Gradient Background */}
                <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} mb-4 text-3xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section with Enhanced Cards */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're a student, owner, or service provider - we've got you covered
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <div
                key={index}
                className="relative group animate-scale-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-gray-100 overflow-hidden">
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-7xl mb-6 text-center transform group-hover:scale-110 transition-transform duration-300">
                      {type.icon}
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-gray-900 text-center">{type.title}</h3>
                    <p className="text-gray-600 mb-6 text-center">{type.description}</p>

                    <ul className="space-y-3 mb-8">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-700 transform transition-all duration-300 hover:translate-x-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 text-white text-sm">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to={type.link}>
                      <Button
                        variant="primary"
                        fullWidth
                        className={`bg-gradient-to-r ${type.gradient} hover:shadow-glow-md transform hover:scale-105 transition-all duration-300`}
                      >
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Enhanced Design */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down">Ready to Find Your Home?</h2>
          <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto animate-fade-in-up">
            Join thousands of SLIIT students who found their perfect accommodation
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" className="bg-white text-blue-600 hover:bg-gray-100 hover:shadow-glow-lg transform hover:scale-110 transition-all duration-300 font-semibold px-8">
                Sign Up Now →
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 backdrop-blur-md bg-white/10 transform hover:scale-110 transition-all duration-300 font-semibold px-8">
                Explore Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
