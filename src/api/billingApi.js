import {
  apiRequest,
} from './apiClient';

function normalizePackage(
  item = {}
) {
  return {
    id:
      item.id ??
      item.package_id,

    name:
      item.name ||
      'Gói credit',

    credits:
      Number(
        item.credits ?? 0
      ),

    price:
      Number(
        item.price ?? 0
      ),

    currency:
      item.currency ||
      'VND',

    description:
      item.description ||
      '',

    badge:
      item.badge ||
      null,

    featured:
      Boolean(
        item.featured
      ),
  };
}

export async function getCreditPackages() {
  const data =
    await apiRequest(
      '/billing/packages'
    );

  const rawItems =
    Array.isArray(data)
      ? data
      : data?.items ?? [];

  return {
    items:
      rawItems.map(
        normalizePackage
      ),

    paymentEnabled:
      Boolean(
        data?.payment_enabled ??
          false
      ),
  };
}

export async function createCheckout({
  packageId,
  paymentMethod,
}) {
  const data =
    await apiRequest(
      '/billing/checkout',
      {
        method: 'POST',

        body: {
          package_id:
            packageId,

          payment_method:
            paymentMethod,
        },
      }
    );

  if (!data?.checkout_url) {
    throw new Error(
      'Backend không trả checkout_url.'
    );
  }

  return {
    paymentId:
      data.payment_id ??
      null,

    checkoutUrl:
      data.checkout_url,
  };
}