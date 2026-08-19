import {
  apiRequest,
} from './apiClient';

export async function updateProfile({
  fullName,
  displayName,
  phone,
  language,
}) {
  return apiRequest(
    '/users/me',
    {
      method: 'PATCH',

      body: {
        full_name: fullName,
        display_name: displayName,
        phone,
        language,
      },
    }
  );
}

export async function uploadAvatar(
  file
) {
  const formData =
    new FormData();

  formData.append(
    'avatar',
    file
  );

  return apiRequest(
    '/users/me/avatar',
    {
      method: 'POST',
      body: formData,
    }
  );
}