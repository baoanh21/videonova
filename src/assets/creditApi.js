import { apiRequest } from '../api/apiClient';

export async function getCreditBalance() {
  const data = await apiRequest(
    '/credits/balance'
  );

  return {
    balance: Number(
      data?.balance ??
        data?.remaining_credit ??
        data?.credit ??
        0
    ),

    freeCredit: Number(
      data?.free_credit ?? 0
    ),

    paidCredit: Number(
      data?.paid_credit ?? 0
    ),
  };
}