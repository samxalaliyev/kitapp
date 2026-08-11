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

    return config;
  });
};
