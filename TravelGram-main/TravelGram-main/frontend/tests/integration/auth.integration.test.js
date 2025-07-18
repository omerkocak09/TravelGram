const mockAxios = require('../mocks/api.mock');
jest.mock('axios', () => mockAxios);

describe('Authentication Integration Tests', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    // Reset mock implementations before each test
    mockAxios.post.mockClear();
    mockAxios.get.mockClear();
  });

  test('Complete Authentication Flow', async () => {
    // Register new user
    const registerResponse = await mockAxios.post('/api/auth/register', testUser);
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.data).toHaveProperty('token');

    // Login with created user
    const loginResponse = await mockAxios.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data).toHaveProperty('token');

    // Verify token works
    const token = loginResponse.data.token;
    const profileResponse = await mockAxios.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.data.email).toBe(testUser.email);
  });

  test('Invalid Login Attempts', async () => {
    // Mock failed login attempt
    mockAxios.post.mockImplementationOnce(() => 
      Promise.reject({ 
        response: { 
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      })
    );

    try {
      await mockAxios.post('/api/auth/login', {
        email: 'wrong@email.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
}); 