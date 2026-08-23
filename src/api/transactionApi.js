import {
  apiRequest,
} from './apiClient';

export const TRANSACTION_TYPES = {
  CREDIT: 'CREDIT',
  VIDEO_USAGE: 'VIDEO_USAGE',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

export function normalizeTransaction(
  item = {}
) {
  return {
    id:
      item.id ??
      item.transaction_id,

    code:
      item.code ||
      item.transaction_code ||
      String(
        item.id ??
          item.transaction_id ??
          ''
      ),

    type:
      String(
        item.type ||
          item.transaction_type ||
          ''
      ).toUpperCase(),

    status:
      String(
        item.status || ''
      ).toUpperCase(),

    description:
      item.description ||
      item.content ||
      '-',

    creditAmount:
      Number(
        item.credit_amount ??
          item.credits ??
          0
      ),

    amount:
      Number(
        item.amount ??
          item.payment_amount ??
          0
      ),

    currency:
      item.currency ||
      'VND',

    videoId:
      item.video_id ??
      null,

    paymentId:
      item.payment_id ??
      null,

    createdAt:
      item.created_at ??
      null,
  };
}

export async function getTransactions({
  page = 1,
  limit = 10,
  search = '',
  order = 'desc',
} = {}) {
  const query =
    new URLSearchParams();

  query.set(
    'page',
    String(page)
  );

  query.set(
    'limit',
    String(limit)
  );

  query.set(
    'order',
    order === 'asc'
      ? 'asc'
      : 'desc'
  );

  if (search.trim()) {
    query.set(
      'search',
      search.trim()
    );
  }

  const data =
    await apiRequest(
      `/transactions?${query.toString()}`
    );

  if (Array.isArray(data)) {
    return {
      items:
        data.map(
          normalizeTransaction
        ),

      total:
        data.length,

      page: 1,

      limit:
        data.length || limit,

      totalPages: 1,

      summary: null,
    };
  }

  const rawItems =
    data?.items ??
    data?.transactions ??
    [];

  const total =
    Number(
      data?.total ??
        rawItems.length
    );

  const currentLimit =
    Number(
      data?.limit ??
        limit
    );

  return {
    items:
      rawItems.map(
        normalizeTransaction
      ),

    total,

    page:
      Number(
        data?.page ??
          page
      ),

    limit:
      currentLimit,

    totalPages:
      Number(
        data?.total_pages ??
          Math.max(
            1,
            Math.ceil(
              total /
                currentLimit
            )
          )
      ),

    summary:
      data?.summary ??
      null,
  };
}