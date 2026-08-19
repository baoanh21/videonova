import {
  apiRequest,
} from './apiClient';

export async function getCreditBalance() {
  const data =
    await apiRequest(
      '/credits/balance'
    );

  const freeRemaining =
    Number(
      data?.free_remaining ??
        data?.free_credit ??
        0
    );

  const freeLimit =
    Number(
      data?.free_limit ??
        data?.daily_free_limit ??
        0
    );

  return {
    balance:
      Number(
        data?.balance ??
          data?.remaining_credit ??
          data?.credit ??
          0
      ),

    freeRemaining,

    freeCredit:
      freeRemaining,

    freeLimit,

    freeUsed:
      Number(
        data?.free_used ??
          Math.max(
            freeLimit -
              freeRemaining,
            0
          )
      ),

    paidCredit:
      Number(
        data?.paid_credit ??
          data?.purchased_credit ??
          0
      ),

    nextResetAt:
      data?.next_reset_at ??
      null,
  };
}