import type { Migration } from './helpers';

export const migration004: Migration = {
  version: 4,
  name: '004_disable_demo_fixtures_by_default',
  up: (db) => {
    // Existing households must explicitly opt into synthetic demo data.
    db.exec('UPDATE user_settings SET use_demo_fixtures = 0;');
  },
};
