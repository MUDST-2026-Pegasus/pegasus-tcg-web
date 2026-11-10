#!/usr/bin/env bash
# Disposable local/CI environment. Never resets the developer's database.
set -euo pipefail
web_root="$(cd "$(dirname "$0")/.." && pwd)"
api_root="${AUCTION_API_DIR:-$web_root/../pegasus-tcg-api}"
qa_tag="pegasus-auction-qa-$$"
qa_logs="${AUCTION_LOG_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/pegasus-auction-qa.XXXXXX")}"
echo "auction e2e logs: $qa_logs"
mkdir -p "$qa_logs"
api_pid=""
web_pid=""
cleanup() {
  [ -z "$api_pid" ] || kill "$api_pid" 2>/dev/null || true
  [ -z "$web_pid" ] || kill "$web_pid" 2>/dev/null || true
  docker rm -f "$qa_tag-pg" "$qa_tag-minio" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker run -d --name "$qa_tag-pg" -p 55432:5432 -e POSTGRES_PASSWORD=auctionqa -e POSTGRES_DB=auctionqa postgres:17-alpine >/dev/null
docker run -d --name "$qa_tag-minio" -p 59000:9000 -e MINIO_ROOT_USER=auctionqa -e MINIO_ROOT_PASSWORD=auctionqa "${AUCTION_MINIO_IMAGE:-pgsty/minio:RELEASE.2026-08-04T00-00-00Z}" server /data >/dev/null
for attempt in $(seq 1 60); do docker exec "$qa_tag-pg" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
export APP_ENV_FILE=/tmp/pegasus-auction-no-env
export DB_URL=jdbc:postgresql://localhost:55432/auctionqa DB_USERNAME=postgres DB_PASSWORD=auctionqa
export JWT_SECRET=YXVjdGlvbi1xYS1vbmx5LXNlY3JldC1mb3ItdGVzdHMtMTIzNDU2Nzg5MDEyMzQ1
export MINIO_ENDPOINT=http://localhost:59000 MINIO_PUBLIC_ENDPOINT=http://localhost:59000 MINIO_ACCESS_KEY=auctionqa MINIO_SECRET_KEY=auctionqa
export LOG_FORMAT=logstash CORS_ALLOWED_ORIGINS=http://localhost:5178 AUTH_RATE_LIMIT_PER_MINUTE=10000
(cd "$api_root" && ./gradlew bootJar -x test) > "$qa_logs/backend-build.log" 2>&1
java -jar "$(find "$api_root/build/libs" -name '*.jar' ! -name '*plain*' | head -1)" --server.port=8088 --spring.profiles.active=local --pegasus.payment.mock-enabled=true '--pegasus.auction.close-cron=*/1 * * * * *' '--pegasus.auction.payment-timeout-cron=*/1 * * * * *' > "$qa_logs/backend.log" 2>&1 &
api_pid=$!
for attempt in $(seq 1 90); do curl -fsS http://localhost:8088/api/v1/games >/dev/null 2>&1 && break; sleep 2; done
curl -fsS http://localhost:8088/api/v1/games >/dev/null
docker cp "$api_root/src/test/resources/db/full-seed" "$qa_tag-pg:/tmp/seed" >/dev/null
docker exec "$qa_tag-pg" sh /tmp/seed/run-seed.sh auctionqa postgres http://localhost:59000/pegasus 0 > "$qa_logs/seed.log" 2>&1
cd "$web_root"
VITE_API_BASE_URL=http://localhost:8088 pnpm dev --host localhost --port 5178 > "$qa_logs/web.log" 2>&1 &
web_pid=$!
for attempt in $(seq 1 30); do curl -fsS http://localhost:5178 >/dev/null 2>&1 && break; sleep 1; done
for round in $(seq 1 "${AUCTION_ROUNDS:-3}"); do
  # Reset only this throwaway DB so each stability round starts from BE-13 seed.
  if [ "$round" -gt 1 ]; then docker exec "$qa_tag-pg" sh /tmp/seed/run-seed.sh auctionqa postgres http://localhost:59000/pegasus 1 > "$qa_logs/seed-$round.log" 2>&1; fi
  pnpm exec cypress run --browser "${AUCTION_BROWSER:-electron}" --config baseUrl=http://localhost:5178 --spec 'src/test/cypress/e2e/auction/*.cy.ts' --env runAuction=true,apiBaseUrl=http://localhost:8088 2>&1 | tee "$qa_logs/cypress-$round.log"
done
