const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    if (!manifest.queries) {
      manifest.queries = [];
    }

    if (!manifest.queries[0].package) {
      manifest.queries[0].package = [];
    }

    const packages = manifest.queries[0].package;

    const hasInstagram = packages.some(
      (pkg) => pkg.$['android:name'] === 'com.instagram.android'
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
