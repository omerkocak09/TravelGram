const detox = require('detox');
const { device, element, by, expect: detoxExpect } = require('detox');
const { installQuiet } = require('detox/runners/jest/adapter');

describe('User Journey Tests', () => {
  beforeAll(async () => {
    await installQuiet();
    await detox.init();
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('Complete User Journey', async () => {
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    // Wait for home screen
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // Create a post
    await element(by.id('create-post-button')).tap();
    await element(by.id('post-text-input')).typeText('My first post!');
    await element(by.id('submit-post-button')).tap();

    // Verify post appears in feed
    await detoxExpect(element(by.text('My first post!'))).toBeVisible();

    // Like the post
    await element(by.id('like-button')).tap();
    await detoxExpect(element(by.id('like-count'))).toHaveText('1');
  });

  test('Search and Follow User', async () => {
    // Navigate to search
    await element(by.id('search-tab')).tap();

    // Search for user
    await element(by.id('search-input')).typeText('testuser');
    await element(by.id('search-button')).tap();

    // Follow user
    await element(by.id('follow-button')).tap();
    await detoxExpect(element(by.id('following-status'))).toHaveText('Following');

    // View profile
    await element(by.id('user-profile')).tap();
    await detoxExpect(element(by.id('profile-screen'))).toBeVisible();
  });

  afterAll(async () => {
    await device.terminateApp();
    await detox.cleanup();
  });
}); 