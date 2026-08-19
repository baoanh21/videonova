export function getTransactionTypeLabel(
  type
) {
  const normalized =
    String(type || '')
      .toUpperCase();

  const map = {
    PURCHASE:
      'Mua credit',

    VIDEO_USAGE:
      'Sử dụng credit',

    DAILY_FREE:
      'Credit miễn phí',

    REFUND:
      'Hoàn credit',

    ADJUSTMENT:
      'Điều chỉnh',
  };

  return (
    map[normalized] ||
    'Giao dịch'
  );
}

export function getTransactionStatusLabel(
  status
) {
  const normalized =
    String(status || '')
      .toUpperCase();

  const map = {
    COMPLETED:
      'Thành công',

    PENDING:
      'Đang chờ',

    FAILED:
      'Thất bại',

    REFUNDED:
      'Đã hoàn tiền',
  };

  return (
    map[normalized] ||
    'Không xác định'
  );
}

export function getTransactionCreditText(
  transaction
) {
  const amount =
    Number(
      transaction?.creditAmount ??
        0
    );

  if (amount > 0) {
    return `+${amount}`;
  }

  return String(amount);
}