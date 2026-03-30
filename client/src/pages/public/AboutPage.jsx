import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const AboutPage = () => {
  const values = [
    {
      title: 'Trust & Safety',
      description:
        'Every listing is moderated to help students and families choose accommodation with confidence.',
      icon: '🛡️',
    },
    {
      title: 'Student First',
      description:
        'Our experience is designed around student needs: affordability, location, and quality living.',
      icon: '🎓',
    },
    {
      title: 'Reliable Support',
      description:
        'From search to move-in, our support flow helps students, owners, and providers stay connected.',
      icon: '🤝',
    },
  ];

  const highlights = [
    { label: 'Verified Listings', value: '500+' },
    { label: 'Students Served', value: '2000+' },
    { label: 'Trusted Property Owners', value: '100+' },
    { label: 'Average Rating', value: '4.8/5' },
  ];

  return (
    <div className="bg-gradient-to-b from-secondary via-white to-secondary">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-700 py-20 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-28 top-0 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">About UNIHOME</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
              Building Better Student Living Experiences
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-emerald-50 md:text-xl">
              UNIHOME helps students discover trusted accommodation while giving property owners
              and service providers a professional platform to manage housing journeys end-to-end.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto -mt-8 px-4 pb-8">
        <div className="grid gap-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-lg md:grid-cols-4 md:p-8">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 text-center">
              <p className="text-3xl font-extrabold text-primary-700">{item.value}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr,1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Our Mission</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
              Make Student Housing Transparent, Safe, and Accessible
            </h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Finding student accommodation should not be stressful. UNIHOME centralizes discovery,
              verification, communication, and booking support in one clean workflow. We focus on
              location confidence, trusted listings, and smooth collaboration among students,
              property owners, and support providers.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/search">
                <Button variant="primary" className="w-full sm:w-auto">
                  Explore Listings
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="w-full sm:w-auto">
                  Join UNIHOME
                </Button>
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
            <img
              src="/upload/unihome-logo.png"
              alt="UNIHOME logo"
              className="h-full min-h-[300px] w-full object-contain bg-white p-8"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Our Values</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">What Guides UNIHOME</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {values.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-2xl text-white">
                {item.icon}
              </div>
              <h4 className="text-xl font-bold text-gray-900">{item.title}</h4>
              <p className="mt-2 text-gray-600 leading-7">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
