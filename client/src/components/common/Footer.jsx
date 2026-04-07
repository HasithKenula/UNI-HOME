import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-emerald-100/80 bg-gradient-to-b from-emerald-50 via-green-50 to-emerald-100/70 text-slate-700 shadow-[0_-12px_40px_rgba(16,185,129,0.06)]">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4 md:pr-6">
            <h3 className="flex items-center text-lg font-bold tracking-wide text-slate-900">
              <span className="mr-2 text-2xl">🏠</span>
              <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                UNIHOME
              </span>
            </h3>
            <p className="max-w-xs text-sm leading-6 text-slate-600">
              A trusted accommodation platform for SLIIT students, designed to keep the search
              simple, reliable, and well organized.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                Verified listings
              </span>
              <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                Student focused
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/search" className="text-slate-600 transition-colors hover:text-emerald-700">
                  Search Accommodations
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-600 transition-colors hover:text-emerald-700">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-600 transition-colors hover:text-emerald-700">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-600 transition-colors hover:text-emerald-700">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
              For Owners
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/register" className="text-slate-600 transition-colors hover:text-emerald-700">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/owner-guide" className="text-slate-600 transition-colors hover:text-emerald-700">
                  Owner Guide
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-slate-600 transition-colors hover:text-emerald-700">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  📧
                </span>
                <span>accommodation@sliit.lk</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  📱
                </span>
                <span>+94 11 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  📍
                </span>
                <span>SLIIT, Malabe, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-emerald-200/80 pt-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© 2026 UNIHOME. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/privacy" className="transition-colors hover:text-emerald-700">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-emerald-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
