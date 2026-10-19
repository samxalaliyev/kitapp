const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    // 1. Təhlükəli SYSTEM_ALERT_WINDOW icazəsini ləğv edirik (Google Play rejection qarşısını almaq üçün)
    if (manifest['uses-permission']) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (perm) => perm?.$?.['android:name'] !== 'android.permission.SYSTEM_ALERT_WINDOW'
      );
    }

    // 2. Paket sorğuları (Instagram və paylaşım üçün)
    if (!manifest.queries) {
      manifest.queries = [];
    }

    let packageQuery = manifest.queries.find((q) => q && q.package);
    if (!packageQuery) {
      packageQuery = { package: [] };
      manifest.queries.push(packageQuery);
    }

    if (!packageQuery.package) {
      packageQuery.package = [];
    }

    const packages = packageQuery.package;
    const hasInstagram = packages.some(
      (pkg) => pkg && pkg.$ && pkg.$['android:name'] === 'com.instagram.android'
    );

    if (!hasInstagram) {
      packages.push({
        $: {
          'android:name': 'com.instagram.android',
        },
      });
    }

    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // 3. Android Auto Backup söndürülür (Tətbiq silinib yenidən yüklənəndə köhnə dataların bərpa olunmaması üçün)
    if (manifest.application && manifest.application[0] && manifest.application[0].$) {
      manifest.application[0].$['android:allowBackup'] = 'false';
      manifest.application[0].$['android:fullBackupContent'] = 'false';

      // 4. Ensure AdMob APPLICATION_ID exists in application meta-data with tools:replace
      if (!manifest.application[0]['meta-data']) {
        manifest.application[0]['meta-data'] = [];
      }
      const existingAdMob = manifest.application[0]['meta-data'].find(
        (m) => m?.$?.['android:name'] === 'com.google.android.gms.ads.APPLICATION_ID'
      );
      if (existingAdMob) {
        existingAdMob.$['android:value'] = 'ca-app-pub-8755646993189983~6362533179';
        existingAdMob.$['tools:replace'] = 'android:value';
      } else {
        manifest.application[0]['meta-data'].push({
          $: {
            'android:name': 'com.google.android.gms.ads.APPLICATION_ID',
            'android:value': 'ca-app-pub-8755646993189983~6362533179',
            'tools:replace': 'android:value',
          },
        });
      }
    }

    return config;
  });
};
