import {
  apiRequest,
} from './apiClient';

export function normalizeSettings(
  data = {}
) {
  const notifications =
    data.notifications || {};

  return {
    videoCompleted:
      notifications.video_completed ??
      true,

    videoFailed:
      notifications.video_failed ??
      true,

    lowCredit:
      notifications.low_credit ??
      true,

    productUpdates:
      notifications.product_updates ??
      false,

    lowCreditThreshold:
      Number(
        data.low_credit_threshold ??
          20
      ),

    lastPasswordChangedAt:
      data.last_password_changed_at ||
      null,
  };
}

export async function getSettings() {
  const data =
    await apiRequest(
      '/users/me/settings'
    );

  return normalizeSettings(data);
}

export async function updateSettings({
  videoCompleted,
  videoFailed,
  lowCredit,
  productUpdates,
  lowCreditThreshold = 20,
}) {
  const data =
    await apiRequest(
      '/users/me/settings',
      {
        method: 'PATCH',

        body: {
          notifications: {
            video_completed:
              videoCompleted,

            video_failed:
              videoFailed,

            low_credit:
              lowCredit,

            product_updates:
              productUpdates,
          },

          low_credit_threshold:
            lowCreditThreshold,
        },
      }
    );

  return normalizeSettings(data);
}

export function changePassword({
  currentPassword,
  newPassword,
}) {
  return apiRequest(
    '/auth/change-password',
    {
      method: 'POST',

      body: {
        current_password:
          currentPassword,

        new_password:
          newPassword,
      },
    }
  );
}

export function deleteAccount({
  password,
}) {
  return apiRequest(
    '/users/me',
    {
      method: 'DELETE',

      body: {
        password,
      },
    }
  );
}