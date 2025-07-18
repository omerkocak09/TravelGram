const mockAxios = {
  post: jest.fn(),
  get: jest.fn()
};

// Default successful responses
mockAxios.post.mockImplementation((url) => {
  if (url.includes('/auth/register')) {
    return Promise.resolve({
      status: 201,
      data: { token: 'mock-token' }
    });
  }
  if (url.includes('/auth/login')) {
    return Promise.resolve({
      status: 200,
      data: { token: 'mock-token' }
    });
  }
  return Promise.resolve({ status: 200 });
});

mockAxios.get.mockImplementation((url) => {
  if (url.includes('/users/profile')) {
    return Promise.resolve({
      status: 200,
      data: {
        email: 'test@example.com',
        username: 'testuser'
      }
    });
  }
  return Promise.resolve({ status: 200 });
});

module.exports = mockAxios; 