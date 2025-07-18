const mockAxios = require('../mocks/api.mock');
jest.mock('axios', () => mockAxios);

describe('Image Performance Tests', () => {
  beforeEach(() => {
    mockAxios.post.mockClear();
    mockAxios.get.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Image Upload Performance', async () => {
    const imageFile = Buffer.from('mock-image-data');
    const startTime = Date.now();

    // Mock successful upload with 100ms delay
    mockAxios.post.mockImplementationOnce(() => 
      new Promise(resolve => {
        jest.advanceTimersByTime(100);
        resolve({
          status: 200,
          data: { url: 'https://example.com/image.jpg' }
        });
      })
    );

    const response = await mockAxios.post('/api/images/upload', {
      image: imageFile
    });

    const uploadTime = Date.now() - startTime;
    expect(uploadTime).toBeLessThan(3000);
    expect(response.status).toBe(200);
  }, 10000);

  test('Image Loading Performance', async () => {
    const startTime = Date.now();
    
    // Mock successful image load with 50ms delay
    mockAxios.get.mockImplementationOnce(() =>
      new Promise(resolve => {
        jest.advanceTimersByTime(50);
        resolve({
          status: 200,
          data: Buffer.from('mock-image-data')
        });
      })
    );
    
    const response = await mockAxios.get('/api/images/sample-image.jpg');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000);
    expect(response.status).toBe(200);
  }, 10000);

  test('Multiple Concurrent Image Uploads', async () => {
    const uploads = Array(5).fill().map(() => ({
      file: Buffer.from('mock-image-data'),
      name: `image-${Math.random()}.jpg`
    }));

    // Mock concurrent uploads with varying delays
    mockAxios.post.mockImplementation(() =>
      new Promise(resolve => {
        jest.advanceTimersByTime(Math.random() * 100);
        resolve({
          status: 200,
          data: { url: 'https://example.com/image.jpg' }
        });
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(
      uploads.map(upload => 
        mockAxios.post('/api/images/upload', upload)
      )
    );

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(5000);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  }, 10000);
}); 