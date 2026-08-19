import {
  apiRequest,
} from './apiClient';

function normalizeUser(
  user = {}
) {
  return {
    id:
      user.id ??
      user.user_id,

    fullName:
      user.full_name ||
      user.name ||
      '',

    displayName:
      user.display_name ||
      user.full_name ||
      user.name ||
      '',

    email:
      user.email || '',

    phone:
      user.phone || '',

    language:
      user.language ||
      'vi',

    avatarUrl:
      user.avatar_url ||
      null,

    emailVerified:
      Boolean(
        user.email_verified ??
          user.is_email_verified
      ),

    role:
      user.role ||
      'user',

    plan:
      user.plan ||
      user.plan_name ||
      'free',

    createdAt:
      user.created_at ||
      null,
  };
}

function normalizeAuthResponse(
  data = {}
) {
  const accessToken =
    data.access_token ||
    data.accessToken;

  if (!accessToken) {
    throw new Error(
      'Backend không trả access_token.'
    );
  }

  return {
    accessToken,

    refreshToken:
      data.refresh_token ||
      data.refreshToken ||
      null,

    user:
      data.user
        ? normalizeUser(
            data.user
          )
        : null,
  };
}

export async function loginUser({
  email,
  password,
}) {
  const data =
    await apiRequest(
      '/auth/login',
      {
        method: 'POST',
        body: {
          email,
          password,
        },
      }
    );

  return normalizeAuthResponse(
    data
  );
}

export async function registerUser({
  fullName,
  email,
  password,
}) {
  const data =
    await apiRequest(
      '/auth/register',
      {
        method: 'POST',
        body: {
          full_name: fullName,
          email,
          password,
        },
      }
    );

  /*
   * Backend có thể:
   * 1. trả token luôn
   * 2. chỉ tạo user
   */
  if (
    data?.access_token ||
    data?.accessToken
  ) {
    return {
      authenticated: true,
      ...normalizeAuthResponse(
        data
      ),
    };
  }

  return {
    authenticated: false,

    user:
      normalizeUser(
        data?.user ??
        data
      ),
  };
}

export async function getCurrentUser() {
  const data =
    await apiRequest(
      '/users/me'
    );

  return normalizeUser(data);
}

export function forgotPassword(
  email
) {
  return apiRequest(
    '/auth/forgot-password',
    {
      method: 'POST',
      body: {
        email,
      },
    }
  );
}

export function logoutUser() {
  return apiRequest(
    '/auth/logout',
    {
      method: 'POST',
    }
  );
}