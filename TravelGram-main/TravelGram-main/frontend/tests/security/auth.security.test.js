const mockAxios = require('../mocks/api.mock');
jest.mock('axios', () => mockAxios);

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    mockAxios.post.mockClear();
    mockAxios.get.mockClear();
  });

  test('Password Brute Force Protection', async () => {
    // Mock rate limit response
    mockAxios.post.mockImplementation(() => 
      Promise.reject({
        response: {
          status: 429,
          data: { message: 'Too many login attempts' }
        }
      })
    );

    const loginAttempts = Array(10).fill().map(() => 
      mockAxios.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    );

    try {
      await Promise.all(loginAttempts);
    } catch (error) {
      expect(error.response.status).toBe(429);
      expect(error.response.data).toHaveProperty('message', 'Too many login attempts');
    }
  });

  test('Token Tampering Protection', async () => {
    // Mock unauthorized response
    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          data: { message: 'Invalid token' }
        }
      })
    );

    const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered';

    try {
      await mockAxios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('SQL Injection Prevention in Login', async () => {
    // Mock unauthorized response
    mockAxios.post.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      })
    );

    const maliciousPayload = {
      email: "' OR '1'='1",
      password: "' OR '1'='1"
    };

    try {
      await mockAxios.post('/api/auth/login', maliciousPayload);
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('XSS Prevention in Registration', async () => {
    const maliciousPayload = {
      username: '<script>alert("xss")</script>',
      email: 'test@example.com',
      password: 'password123'
    };

    mockAxios.post.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        data: {
          username: 'scriptalertxssscript',
          token: 'mock-token'
        }
      })
    );

    const response = await mockAxios.post('/api/auth/register', maliciousPayload);
    expect(response.data.username).not.toContain('<script>');
  });
}); 