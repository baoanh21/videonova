import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Icon from '../components/Icon';

import {
  EmptyState,
  PageHeader,
  StatusBadge,
} from '../components/UI';

import {
  getAdminUsers,
  grantAdminCredits,
  setAdminUserLocked,
} from '../api/adminApi';

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  ).format(date);
}

function normalizeUser(user = {}) {
  return {
    id: user.id || '',

    fullName:
      user.full_name ||
      user.fullName ||
      user.display_name ||
      user.displayName ||
      user.email ||
      'Người dùng',

    email:
      user.email || '-',

    role:
      String(
        user.role || 'USER'
      ).toUpperCase(),

    isLocked:
      Boolean(
        user.is_locked ??
        user.isLocked
      ),

    creditBalance:
      Number(
        user.credit_balance ??
        user.creditBalance ??
        0
      ),

    createdAt:
      user.created_at ??
      user.createdAt ??
      null,
  };
}

export default function AdminUsers() {
  const [users, setUsers] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    searchInput,
    setSearchInput,
  ] = useState('');

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    actionUserId,
    setActionUserId,
  ] = useState('');

  const [
    actionMessage,
    setActionMessage,
  ] = useState('');

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await getAdminUsers({
            page,
            limit: PAGE_SIZE,
            search,
            order: 'desc',
          });

        const items =
          Array.isArray(data?.items)
            ? data.items
            : [];

        setUsers(
          items.map(
            normalizeUser
          )
        );

        setTotal(
          Number(
            data?.total ?? 0
          )
        );

        setTotalPages(
          Number(
            data?.total_pages ?? 1
          )
        );
      } catch (err) {
        setError(
          err?.message ||
            'Không thể tải danh sách người dùng.'
        );
      } finally {
        setLoading(false);
      }
    }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      setPage(1);
      setSearch(
        searchInput.trim()
      );
    };

  const handleToggleLock =
    async (user) => {
      try {
        setActionMessage('');
        setActionUserId(
          user.id
        );

        await setAdminUserLocked(
          user.id,
          !user.isLocked
        );

        setActionMessage(
          user.isLocked
            ? 'Đã mở khóa tài khoản.'
            : 'Đã khóa tài khoản.'
        );

        await loadUsers();
      } catch (err) {
        setActionMessage(
          err?.message ||
            'Không thể cập nhật trạng thái tài khoản.'
        );
      } finally {
        setActionUserId('');
      }
    };

  const handleGrantCredits =
    async (user) => {
      const creditInput =
        window.prompt(
          `Nhập số credit muốn cấp cho ${user.email}:`,
          '10'
        );

      if (creditInput === null) {
        return;
      }

      const credits =
        Number(creditInput);

      if (
        !Number.isInteger(credits) ||
        credits < 1 ||
        credits > 100000
      ) {
        setActionMessage(
          'Số credit phải là số nguyên từ 1 đến 100000.'
        );

        return;
      }

      const reason =
        window.prompt(
          'Nhập lý do cấp credit:',
          'Hỗ trợ người dùng'
        );

      if (reason === null) {
        return;
      }

      if (!reason.trim()) {
        setActionMessage(
          'Lý do cấp credit không được để trống.'
        );

        return;
      }

      try {
        setActionMessage('');
        setActionUserId(
          user.id
        );

        await grantAdminCredits(
          user.id,
          {
            credits,
            reason:
              reason.trim(),
          }
        );

        setActionMessage(
          `Đã cấp ${credits.toLocaleString(
            'vi-VN'
          )} credit cho ${user.email}.`
        );

        await loadUsers();
      } catch (err) {
        setActionMessage(
          err?.message ||
            'Không thể cấp credit.'
        );
      } finally {
        setActionUserId('');
      }
    };

  return (
    <div className="page-wrap admin-page">
      <PageHeader
        eyebrow="QUẢN LÝ NGƯỜI DÙNG"
        title="Người dùng"
        description="Tìm kiếm, xem số dư credit và quản lý trạng thái tài khoản."
      />

      {actionMessage && (
        <div className="transaction-message">
          {actionMessage}
        </div>
      )}

      <div className="table-toolbar">
        <form
          className="search-field wide"
          onSubmit={handleSearch}
        >
          <Icon
            name="search"
            className="w-4 h-4"
          />

          <input
            type="search"
            value={searchInput}
            placeholder="Tìm theo tên hoặc email..."
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
          />
        </form>

        <div className="toolbar-right">
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setPage(1);
              }}
            >
              Xóa tìm kiếm
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadUsers}
          >
            <Icon
              name="refresh"
              className="w-4 h-4"
            />

            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <section className="table-card">
          <EmptyState
            icon="clock"
            title="Đang tải người dùng"
            description="Đang lấy danh sách người dùng từ máy chủ."
          />
        </section>
      ) : error ? (
        <section className="table-card">
          <EmptyState
            icon="x"
            title="Không thể tải người dùng"
            description={error}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={loadUsers}
              >
                Thử lại
              </button>
            }
          />
        </section>
      ) : users.length === 0 ? (
        <section className="table-card">
          <EmptyState
            icon="users"
            title="Không có người dùng"
            description={
              search
                ? 'Không tìm thấy tài khoản phù hợp.'
                : 'Hệ thống chưa có người dùng.'
            }
          />
        </section>
      ) : (
        <section className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Credit</th>
                  <th>Tham gia</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const busy =
                    actionUserId ===
                    user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="table-avatar">
                            {user.fullName
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                user.fullName
                              }
                            </strong>

                            <span>
                              {user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>
                        {user.role}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            user.isLocked
                              ? 'Tạm khóa'
                              : 'Đang hoạt động'
                          }
                        />
                      </td>

                      <td>
                        <strong>
                          {user.creditBalance.toLocaleString(
                            'vi-VN'
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      <td>
                        <div className="toolbar-right">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={busy}
                            onClick={() =>
                              handleGrantCredits(
                                user
                              )
                            }
                          >
                            Cấp credit
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={busy}
                            onClick={() =>
                              handleToggleLock(
                                user
                              )
                            }
                          >
                            {busy
                              ? 'Đang xử lý...'
                              : user.isLocked
                                ? 'Mở khóa'
                                : 'Khóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              Tổng{' '}
              {total.toLocaleString(
                'vi-VN'
              )}{' '}
              người dùng
            </span>

            <div className="pagination compact">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
              >
                ‹
              </button>

              <span>
                Trang {page} /{' '}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >= totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                  )
                }
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}