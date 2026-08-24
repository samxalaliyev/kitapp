const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

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

    // Android Auto Backup söndürülür (Tətbiq silinib yenidən yüklənəndə köhnə dataların bərpa olunmaması üçün)
    if (manifest.application && manifest.application[0] && manifest.application[0].$) {
      manifest.application[0].$['android:allowBackup'] = 'false';
      manifest.application[0].$['android:fullBackupContent'] = 'false';
    }

    return config;
  });
};
