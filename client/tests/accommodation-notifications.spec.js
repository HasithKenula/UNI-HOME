import { test, expect } from '@playwright/test';

const buildAccommodations = () => ([
  {
    _id: 'acc-1',
    title: 'Green Villa Boarding',
    location: { city: 'Malabe', district: 'Colombo' },
    pricing: { monthlyRent: 25000 },
    houseRules: { genderRestriction: 'mixed' },
    facilities: { wifi: true, kitchen: true },
    media: { photos: [{ url: '/uploads/accommodations/a1.jpg' }], videos: [] },
    ratingsSummary: { averageRating: 4.5 },
  },
  {
    _id: 'acc-2',
    title: 'Campus Annex Rooms',
    location: { city: 'Kaduwela', district: 'Colombo' },
    pricing: { monthlyRent: 18000 },
    houseRules: { genderRestriction: 'girls_only' },
    facilities: { wifi: true },
    media: { photos: [{ url: '/uploads/accommodations/a2.jpg' }], videos: [] },
    ratingsSummary: { averageRating: 4.0 },
  },
]);

const buildOwnerListings = () => ([
  {
    _id: 'own-1',
    title: 'Owner Listing One',
    status: 'active',
    location: { city: 'Malabe', district: 'Colombo' },
    pricing: { monthlyRent: 32000 },
    media: { photos: [{ url: '/uploads/accommodations/o1.jpg' }] },
    viewCount: 12,
    totalBookings: 3,
    totalRooms: 5,
    availableRooms: 2,
  },
]);

const defaultNotifications = [
  {
    _id: 'n1',
    title: 'Booking Accepted',
    message: 'Your booking was accepted.',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/search?fromNotification=1',
  },
  {
    _id: 'n2',
    title: 'New Notice',
    message: 'Owner posted a notice.',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/search',
  },
];

const json = (route, payload, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });

async function setAuthState(page, user) {
  await page.addInitScript((u) => {
    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('refreshToken', 'test-refresh-token');
    localStorage.setItem('user', JSON.stringify(u));
  }, user);
}

async function mockApi(page, overrides = {}) {
  const accommodations = overrides.accommodations ?? buildAccommodations();
  const ownerListings = overrides.ownerListings ?? buildOwnerListings();
  const notifications = overrides.notifications ?? defaultNotifications;
  const unreadCount = overrides.unreadCount ?? notifications.filter((n) => !n.isRead).length;
  const completedBookingCount = overrides.completedBookingCount ?? 0;

  await page.route('**/*', async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    const path = url.pathname;

    // Only mock backend API requests. Let frontend assets load normally.
    if (!path.startsWith('/api/')) {
      return route.continue();
    }

    if (path.endsWith('/api/notifications') && method === 'GET') {
      return json(route, {
        success: true,
        data: notifications,
        unreadCount,
        pagination: { page: 1, limit: 10, total: notifications.length, totalPages: 1 },
      });
    }

    if (path.endsWith('/api/notifications/read-all') && method === 'PATCH') {
      return json(route, { success: true, message: 'All notifications marked as read', unreadCount: 0 });
    }

    if (/\/api\/notifications\/[^/]+\/read$/.test(path) && method === 'PATCH') {
      return json(route, {
        success: true,
        data: { _id: path.split('/').at(-2), isRead: true, readAt: new Date().toISOString() },
        unreadCount: Math.max(unreadCount - 1, 0),
      });
    }

    if (path.endsWith('/api/accommodations/owner/my-listings') && method === 'GET') {
      return json(route, {
        success: true,
        data: ownerListings,
        stats: { total: ownerListings.length, active: 1, draft: 0, unpublished: 0 },
      });
    }

    if (path.endsWith('/api/accommodations') && method === 'GET') {
      return json(route, {
        success: true,
        data: accommodations,
        pagination: {
          page: Number(url.searchParams.get('page') || 1),
          limit: 9,
          total: accommodations.length,
          totalPages: 2,
        },
      });
    }

    if (path.endsWith('/api/favorites') && method === 'GET') {
      return json(route, { success: true, data: [] });
    }

    if (/\/api\/favorites\/[^/]+$/.test(path) && (method === 'POST' || method === 'DELETE')) {
      return json(route, { success: true, data: [] });
    }

    if (path.endsWith('/api/bookings') && method === 'GET') {
      const isCompletedQuery = url.searchParams.get('status') === 'completed';
      if (isCompletedQuery) {
        return json(route, {
          success: true,
          data: completedBookingCount > 0 ? [{ _id: 'b1' }] : [],
          pagination: { page: 1, limit: 1, total: completedBookingCount, totalPages: 1 },
        });
      }
      return json(route, { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } });
    }

    return json(route, { success: true, data: [] });
  });
}

test.describe('Frontend E2E: Accommodation + Notifications (10 cases)', () => {
  test('TC01 - Search page shows listing results', async ({ page }) => {
    await mockApi(page);
    await page.goto('/search', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Find Your Space' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Green Villa Boarding/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Campus Annex Rooms/i })).toBeVisible();
  });

  test('TC02 - Apply filters updates URL query params', async ({ page }) => {
    await mockApi(page);
    await page.goto('/search', { waitUntil: 'domcontentloaded' });

    await page.locator('input[placeholder="Search by title or city"]').fill('villa');
    await page.locator('input[placeholder="Min"]').fill('15000');
    await page.locator('input[placeholder="Max"]').fill('30000');
    await page.getByRole('button', { name: /Apply Filters/i }).click();

    await expect(page).toHaveURL(/keyword=villa/);
    await expect(page).toHaveURL(/minPrice=15000/);
    await expect(page).toHaveURL(/maxPrice=30000/);
    await expect(page).toHaveURL(/page=1/);
  });

  test('TC03 - Clear filters resets query params', async ({ page }) => {
    await mockApi(page);
    await page.goto('/search?keyword=villa&minPrice=10000&page=2', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /Clear/i }).click();
    await expect(page).toHaveURL(/\/search$/);
  });

  test('TC04 - No results state appears when API returns empty list', async ({ page }) => {
    await mockApi(page, { accommodations: [] });
    await page.goto('/search', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('No Accommodations Found')).toBeVisible();
  });

  test('TC05 - Pagination next button moves to page 2', async ({ page }) => {
    await mockApi(page);
    await page.goto('/search?page=1', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /^Next$/ }).click();
    await expect(page).toHaveURL(/page=2/);
  });

  test('TC06 - Notification bell hidden for logged-out users', async ({ page }) => {
    await mockApi(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Open notifications' })).toHaveCount(0);
  });

  test('TC07 - Notification bell visible with unread badge for authenticated user', async ({ page }) => {
    await setAuthState(page, { _id: 'u-student', firstName: 'Test', role: 'student' });
    await mockApi(page, { unreadCount: 2 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const bellButton = page.getByRole('button', { name: 'Open notifications' });
    await expect(bellButton).toBeVisible();
    await expect(bellButton.locator('span')).toHaveText('2');
  });

  test('TC08 - Notification dropdown opens and lists unread count', async ({ page }) => {
    await setAuthState(page, { _id: 'u-student', firstName: 'Test', role: 'student' });
    await mockApi(page, { unreadCount: 2 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Open notifications' }).click();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('2 unread')).toBeVisible();
  });

  test('TC09 - Mark all as read updates dropdown unread indicator', async ({ page }) => {
    await setAuthState(page, { _id: 'u-student', firstName: 'Test', role: 'student' });
    await mockApi(page, { unreadCount: 2 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Open notifications' }).click();
    await page.getByRole('button', { name: /Mark all as read/i }).click();

    await expect(page.getByText('0 unread')).toBeVisible();
  });

  test('TC10 - Owner my-listings page renders listing and room-manager toggle', async ({ page }) => {
    await setAuthState(page, { _id: 'u-owner', firstName: 'Owner', role: 'owner' });
    await mockApi(page);
    await page.goto('/owner/my-listings', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /My Listings/i })).toBeVisible();
    await expect(page.getByText('Owner Listing One')).toBeVisible();

    await page.getByRole('button', { name: /Manage Rooms/i }).click();
    await expect(page.getByRole('heading', { name: /Room Management/i })).toBeVisible();
  });
});
