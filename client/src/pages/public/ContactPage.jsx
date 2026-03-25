import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  return (
    <div className="bg-gradient-to-b from-secondary via-white to-secondary">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-accent-700 py-20 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">Contact UNIHOME</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">We Are Here To Help You</h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-emerald-50 md:text-xl">
            Have questions about student accommodation, listings, or account support? Reach out and
            our team will guide you.
          </p>
        </div>
      </section>

      <section className="container mx-auto -mt-8 px-4 pb-8">
        <div className="grid gap-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-lg md:grid-cols-3 md:p-8">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl">📧</p>
            <p className="mt-2 font-semibold text-gray-800">Email</p>
            <p className="text-sm text-gray-600">accommodation@sliit.lk</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl">📱</p>
            <p className="mt-2 font-semibold text-gray-800">Phone</p>
            <p className="text-sm text-gray-600">+94 11 123 4567</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl">📍</p>
            <p className="mt-2 font-semibold text-gray-800">Office</p>
            <p className="text-sm text-gray-600">SLIIT, Malabe, Sri Lanka</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr,1.2fr] lg:items-start">
          <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Support Hours</h2>
            <p className="mt-2 text-gray-600">Our team responds quickly during working hours.</p>

            <div className="mt-6 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span>Monday - Friday</span>
                <span className="font-semibold">8:30 AM - 6:00 PM</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span>Saturday</span>
                <span className="font-semibold">9:00 AM - 1:00 PM</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span>Sunday</span>
                <span className="font-semibold">Closed</span>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-accent-100 bg-accent-50/50 p-4">
              <p className="text-sm font-semibold text-accent-700">Need urgent help?</p>
              <p className="mt-1 text-sm text-gray-700">Call us directly for immediate support regarding active bookings.</p>
            </div>

            <div className="mt-6">
              <Link to="/search">
                <Button variant="outline">Browse Accommodations</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-gray-900">Send Us a Message</h2>
            <p className="mt-2 text-gray-600">Fill out the form and we will get back to you shortly.</p>

            {submitted && (
              <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                Thank you. Your message has been received successfully.
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-700">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="0771234567"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-gray-700">Subject</label>
                  <input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-semibold text-gray-700">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Write your message here..."
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full md:w-auto">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
