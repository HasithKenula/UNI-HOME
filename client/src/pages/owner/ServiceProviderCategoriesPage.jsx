import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiceProviderCategories } from '../../features/providers/providerAPI';

const FALLBACK_CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'painting', label: 'Painting' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'masons', label: 'Masons' },
  { value: 'welding', label: 'Welding' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'other', label: 'Other Services' },
];

const ICONS = {
  plumbing: '🚰',
  electrical: '🔌',
  cleaning: '🧹',
  painting: '🖌️',
  carpentry: '🪚',
  masons: '🧱',
  welding: '⚒️',
  cctv: '📹',
  other: '🛠️',
};

const ServiceProviderCategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getServiceProviderCategories();
        if (Array.isArray(response?.data) && response.data.length > 0) {
          setCategories(response.data);
        }
      } catch (error) {
        setCategories(FALLBACK_CATEGORIES);
      }
    };

    loadCategories();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Maintenance Categories</h1>
      <p className="mt-2 text-gray-600">Select a category to open a dedicated provider list page for that service.</p>

      <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => navigate(`/owner/service-providers/${category.value}`)}
              className="rounded-xl border-2 border-gray-200 bg-white px-4 py-5 text-center transition-all hover:border-amber-300 hover:bg-amber-100"
            >
              <div className="text-4xl">{ICONS[category.value] || '🛠️'}</div>
              <p className="mt-3 font-semibold text-gray-900">{category.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderCategoriesPage;
