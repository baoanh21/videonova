import request from 'supertest';

const baseUrl = process.env.E2E_BASE_URL;
const describeLive = baseUrl ? describe : describe.skip;

describeLive('running VideoNova API', () => {
  it('supports health and the auth lifecycle', async () => {
    const api = request(baseUrl!);
    await api.get('/api/v1/health/live').expect(200);
    const email = `e2e-${Date.now()}@example.com`;
    const register = await api
      .post('/api/v1/auth/register')
      .send({ full_name: 'E2E User', email, password: 'Password123' })
      .expect(201);
    expect(register.body.access_token).toBeTruthy();
    const login = await api
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password123' })
      .expect(200);
    const refresh = await api
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: login.body.refresh_token })
      .expect(200);
    await api
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refresh.body.access_token}`)
      .expect(204);
  });
});
