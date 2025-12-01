import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 100 },
    { duration: "1m", target: 300 },
    { duration: "1m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const url = "http://payments:3000/payments";
  const res = http.get(url);
  check(res, {
    "resposta OK (200)": (r) => r.status === 200,
    "lista de pagamentos": (r) => {
      try { return Array.isArray(r.json()); } catch (e) { return false; }
    },
  });
  sleep(1);
}