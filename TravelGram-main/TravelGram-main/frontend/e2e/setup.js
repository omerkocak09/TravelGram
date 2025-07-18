const { device } = require('detox');

beforeAll(async () => {
  // Test başlamadan önce uygulama ayarlarını sıfırla
  await device.uninstallApp();
  await device.installApp();
});

beforeEach(async () => {
  // Her test öncesi uygulamayı temiz bir durumda başlat
  await device.reloadReactNative();
});

afterAll(async () => {
  // Tüm testler bittiğinde uygulamayı kapat
  await device.terminateApp();
}); 