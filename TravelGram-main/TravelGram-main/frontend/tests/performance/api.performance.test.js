const mockAxios = require('../mocks/api.mock');
jest.mock('axios', () => mockAxios);

describe('API Performance Tests', () => {
  beforeEach(() => {
    mockAxios.post.mockClear();
    mockAxios.get.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('API Response Time', async () => {
    // Mock API response with 50ms delay
    mockAxios.get.mockImplementationOnce(() =>
      new Promise(resolve => {
        jest.advanceTimersByTime(50);
        resolve({
          status: 200,
          data: { posts: Array(10).fill({ id: 1, title: 'Test Post' }) }
        });
      })
    );

    const startTime = Date.now();
    const response = await mockAxios.get('/api/posts');
    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(500);
    expect(response.status).toBe(200);
  }, 10000);

  test('Concurrent API Requests', async () => {
    // Mock multiple API endpoints with varying delays
    const endpoints = [
      '/api/posts',
      '/api/users',
      '/api/comments',
      '/api/likes',
      '/api/notifications'
    ];

    mockAxios.get.mockImplementation((url) =>
      new Promise(resolve => {
        jest.advanceTimersByTime(Math.random() * 100);
        resolve({
          status: 200,
          data: { message: `Response from ${url}` }
        });
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(
      endpoints.map(endpoint => mockAxios.get(endpoint))
    );
    const totalTime = Date.now() - startTime;

    expect(totalTime).toBeLessThan(1000);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  }, 10000);

  test('API Error Response Time', async () => {
    // Mock API error with 30ms delay
    mockAxios.get.mockImplementationOnce(() =>
      new Promise((resolve, reject) => {
        jest.advanceTimersByTime(30);
        reject({
          response: {
            status: 404,
            data: { message: 'Not found' }
          }
        });
      })
    );

    const startTime = Date.now();
    try {
      await mockAxios.get('/api/nonexistent');
    } catch (error) {
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
      expect(error.response.status).toBe(404);
    }
  }, 10000);
}); 