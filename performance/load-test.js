import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GURUNANAK Logistics load test
 *
 * Usage:
 *   k6 run performance/load-test.js
 *   BASE_URL=https://your-api.example.com k6 run performance/load-test.js
 *
 * Requires k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

export default function loadTest() {
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, {
    'health status 200': (r) => r.status === 200,
    'health body ok': (r) => {
      if (r.status !== 200 || r.body == null || r.body === '') return false;
      try {
        return r.json('status') === 'ok';
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);

  const deliveries = http.get(`${BASE_URL}/api/deliveries?page=1&limit=20`, {
    headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN || ''}` },
  });
  check(deliveries, {
    'deliveries responds': (r) => r.status === 200 || r.status === 401,
  });

  sleep(0.5);

  const reports = http.get(`${BASE_URL}/api/reports/summary`, {
    headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN || ''}` },
  });
  check(reports, {
    'reports responds': (r) => r.status === 200 || r.status === 401 || r.status === 503,
  });

  sleep(1);
}
