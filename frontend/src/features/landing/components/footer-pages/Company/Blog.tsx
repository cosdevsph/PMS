import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { PublicPageLayout } from '../../public/PublicPageLayout';
import { PageHeader } from '../../public/PageHeader';
import { CtaBand, ctaBandButtonClass, ctaBandInputClass } from '../../public/CtaBand';
import { Reveal } from '../../motion/Reveal';

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
    <PublicPageLayout title="Blog">
      <PageHeader category="Company" title="Blog" description="Insights and best practices for healthcare management" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Blog Posts */}
        <ul className="grid md:grid-cols-2 gap-6 mb-16 sm:mb-20">
          {posts.map((post, index) => (
            <Reveal as="li" key={post.id} delay={(index % 2) * 80} className="h-full">
              <article className="h-full flex flex-col rounded-2xl bg-white ring-1 ring-gray-200/80 shadow-sm overflow-hidden">
                {/* Branded cover placeholder */}
                <div className="relative h-40 sm:h-44 bg-gradient-to-br from-care-blue/15 via-clinical-cloud to-gentle-renewal/50 overflow-hidden" aria-hidden="true">
                  <div className="absolute right-6 bottom-0 flex items-end gap-2">
                    <div className="w-8 h-20 rounded-t-full bg-white/60" />
                    <div className="w-10 h-14 rounded-t-full bg-white/40" />
                    <div className="w-7 h-10 rounded-t-full bg-white/30" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-care-blue bg-care-blue/10 px-3 py-1 rounded-full font-body">
                      {post.category}
                    </span>
                    <div className="flex items-center text-steady-slate text-sm font-body">
                      <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                      {post.date}
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl tracking-tight text-gray-900 font-display mb-3">
                    {post.title}
                  </h2>
                  <p className="text-steady-slate leading-relaxed font-body mb-6">{post.excerpt}</p>
                  <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div className="flex items-center text-gray-700 text-sm font-body">
                      <User className="w-4 h-4 mr-2 text-steady-slate" aria-hidden="true" />
                      {post.author}
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-care-blue hover:text-trust-harbor transition-colors flex items-center rounded font-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-care-blue focus-visible:ring-offset-2"
                    >
                      Read More <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* Subscribe Section */}
        <CtaBand title="Subscribe to Our Newsletter" description="Get the latest healthcare insights delivered to your inbox">
          <form className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
            <label htmlFor="blog-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="blog-newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className={ctaBandInputClass}
            />
            <button type="submit" className={ctaBandButtonClass}>
              Subscribe
            </button>
          </form>
        </CtaBand>
      </div>
    </PublicPageLayout>
  );
};
