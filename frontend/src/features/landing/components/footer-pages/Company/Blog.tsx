import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';

export const Blog: React.FC = () => {
  const posts = [
    {
      id: 1,
      title: 'How to Streamline Your Clinic Workflow',
      excerpt: 'Discover best practices for organizing your clinic operations and improving staff efficiency.',
      author: 'Sarah Johnson',
      date: 'April 15, 2026',
      category: 'Operations'
    },
    {
      id: 2,
      title: 'Patient Data Security: What You Need to Know',
      excerpt: 'A comprehensive guide to HIPAA compliance and protecting sensitive patient information.',
      author: 'Dr. Michael Chen',
      date: 'April 10, 2026',
      category: 'Security'
    },
    {
      id: 3,
      title: 'The Future of Telemedicine',
      excerpt: 'Exploring how virtual consultations are transforming patient care delivery.',
      author: 'Emma Rodriguez',
      date: 'April 5, 2026',
      category: 'Technology'
    },
    {
      id: 4,
      title: 'Reducing No-Shows: Strategies That Work',
      excerpt: 'Learn proven techniques to decrease appointment cancellations and no-shows.',
      author: 'David Park',
      date: 'March 30, 2026',
      category: 'Best Practices'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-primary-gradient py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center text-healing-mint hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Blog</h1>
          <p className="text-xl text-white/70 mt-2">Insights and best practices for healthcare management</p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-gray-800/50 rounded-lg overflow-hidden border border-white/10 hover:border-healing-mint/50 transition-all hover:shadow-lg cursor-pointer"
            >
              <div className="h-48 bg-gradient-to-br from-healing-mint/20 to-blue-600/20"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-healing-mint bg-healing-mint/10 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                  <div className="flex items-center text-white/60 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {post.date}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3 hover:text-healing-mint transition-colors">
                  {post.title}
                </h2>
                <p className="text-white/70 mb-6">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white/60">
                    <User className="w-4 h-4 mr-2" />
                    {post.author}
                  </div>
                  <button className="text-healing-mint hover:text-white transition-colors flex items-center">
                    Read More <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Subscribe Section */}
        <div className="bg-gradient-to-r from-healing-mint/20 to-blue-600/20 rounded-lg p-12 text-center border border-healing-mint/50">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-xl text-white/70 mb-8">Get the latest healthcare insights delivered to your inbox</p>
          <form className="flex max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-healing-mint"
            />
            <button
              type="submit"
              className="bg-healing-mint text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
