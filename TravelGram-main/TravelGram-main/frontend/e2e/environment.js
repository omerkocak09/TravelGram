const { DetoxCircusEnvironment } = require('detox/runners/jest');
const { device } = require('detox');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Jest'in test sonuçlarını daha detaylı göstermesi için
    this.initTimeout = 300000;
    this.reportTestResults = true;
    this.retries = 3;
  }

  async setup() {
    await super.setup();
    // Test başlamadan önce yapılacak ek işlemler
    try {
      await device.launchApp({ newInstance: true });
    } catch (error) {
      console.error('App launch failed:', error);
    }
  }

  async teardown() {
    // Test bittikten sonra yapılacak temizlik işlemleri
    try {
      await device.terminateApp();
    } catch (error) {
      console.error('App termination failed:', error);
    }
    await super.teardown();
  }

  handleTestEvent(event, state) {
    super.handleTestEvent(event, state);
    
    // Test sonuçlarını detaylı raporlama
    if (event.name === 'test_done') {
      const test = state.currentTest;
      console.log(`\nTest: ${test.name}`);
      console.log(`Status: ${test.errors.length ? '❌ Failed' : '✅ Passed'}`);
      if (test.errors.length) {
        console.log('Errors:', test.errors);
      }
      console.log(`Duration: ${test.duration}ms\n`);
    }
  }
}

module.exports = CustomDetoxEnvironment; 