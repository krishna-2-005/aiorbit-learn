#!/usr/bin/env bash
# API smoke checks: happy paths plus the edge cases from the plan (400/401/404/409).
# Usage: pnpm smoke   (the app must be running; BASE_URL defaults to http://localhost:3000)
set -u

BASE="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
BODY="$(mktemp)"
JAR="$(mktemp)"
trap 'rm -f "$BODY" "$JAR"' EXIT

# check <name> <expected-status> <method> <path> [json-body]
check() {
  local name="$1" expected="$2" method="$3" path="$4" body="${5:-}"
  local args=(-s -o "$BODY" -w "%{http_code}" -X "$method" -b "$JAR" -c "$JAR")
  if [ -n "$body" ]; then args+=(-H "Content-Type: application/json" --data "$body"); fi
  local status
  status=$(curl "${args[@]}" "$BASE$path")
  if [ "$status" = "$expected" ]; then
    PASS=$((PASS + 1))
    printf "  ok    %s  %s\n" "$status" "$name"
  else
    FAIL=$((FAIL + 1))
    printf "  FAIL  %s (expected %s)  %s\n        %s\n" "$status" "$expected" "$name" "$(head -c 300 "$BODY")"
  fi
}

# assert <name> <js-expression over `b` (the last response body)>
assert() {
  local name="$1" expr="$2"
  if node -e "const b=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); process.exit(($expr)?0:1)" "$BODY"; then
    PASS=$((PASS + 1))
    printf "  ok    ---  %s\n" "$name"
  else
    FAIL=$((FAIL + 1))
    printf "  FAIL  ---  %s\n        %s\n" "$name" "$(head -c 300 "$BODY")"
  fi
}

# field <js-expression over `b`> -> prints the value from the last response body
field() {
  node -e "const b=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log($1)" "$BODY"
}

# login <email> <password> -> Auth.js credentials flow (CSRF token + callback), session cookie lands in $JAR
login() {
  curl -s -b "$JAR" -c "$JAR" -o "$BODY" "$BASE/api/auth/csrf"
  local csrf
  csrf=$(field "b.csrfToken")
  curl -s -b "$JAR" -c "$JAR" -o /dev/null -X POST \
    --data-urlencode "csrfToken=$csrf" --data-urlencode "email=$1" --data-urlencode "password=$2" \
    "$BASE/api/auth/callback/credentials"
}

logout() { : > "$JAR"; }

echo "Colleges list"
check "default list" 200 GET "/api/colleges"
assert "envelope has data, total and 12 items" "b.ok && b.data.length === 12 && b.meta.total === 200"
check "filters combined" 200 GET "/api/colleges?state=Karnataka,Tamil%20Nadu&course=BTECH&sort=fees_asc&minRating=3"
assert "every row matches state filter" "b.data.every(c => ['Karnataka','Tamil Nadu'].includes(c.state) && c.rating >= 3)"
assert "sorted by fees ascending" "b.data.every((c, i, a) => i === 0 || a[i-1].minFees <= c.minFees)"
check "bracket array params" 200 GET "/api/colleges?state%5B%5D=Kerala"
assert "bracket params filter" "b.data.length > 0 && b.data.every(c => c.state === 'Kerala')"
check "search by name" 200 GET "/api/colleges?q=kaveri"
assert "search matches" "b.data.length > 0 && b.data.every(c => /kaveri/i.test(c.name + c.city))"
check "limit above cap is clamped" 200 GET "/api/colleges?limit=500"
assert "clamped to 50" "b.data.length === 50"
check "limit=0" 400 GET "/api/colleges?limit=0"
check "limit not a number" 400 GET "/api/colleges?limit=abc"
check "unknown sort" 400 GET "/api/colleges?sort=cheapest"
check "unknown course" 400 GET "/api/colleges?course=PHD"
check "minRating out of range" 400 GET "/api/colleges?minRating=9"
check "minFees > maxFees" 400 GET "/api/colleges?minFees=500000&maxFees=100000"
assert "error has zod details" "b.ok === false && b.error.code === 'BAD_REQUEST' && b.error.details[0].path === 'minFees'"
check "malformed cursor" 400 GET "/api/colleges?cursor=not-a-cursor"

echo "Cursor pagination"
for sort in rating package fees_asc fees_desc name; do
  check "page 1 ($sort)" 200 GET "/api/colleges?sort=$sort&limit=7"
  first_ids=$(field "b.data.map(c => c.id).join(',')")
  cursor=$(field "b.meta.nextCursor")
  check "page 2 ($sort)" 200 GET "/api/colleges?sort=$sort&limit=7&cursor=$cursor"
  assert "no overlap between pages ($sort)" "b.data.length === 7 && b.data.every(c => !'$first_ids'.split(',').includes(c.id))"
done
check "walk all pages" 200 GET "/api/colleges?limit=50"
seen=$(field "b.data.length")
cursor=$(field "b.meta.nextCursor")
while [ "$cursor" != "null" ]; do
  curl -s -o "$BODY" "$BASE/api/colleges?limit=50&cursor=$cursor"
  seen=$((seen + $(field "b.data.length")))
  cursor=$(field "b.meta.nextCursor")
done
if [ "$seen" = "200" ]; then PASS=$((PASS + 1)); echo "  ok    ---  walked 200 rows, no gaps"; else FAIL=$((FAIL + 1)); echo "  FAIL  ---  walked $seen rows, expected 200"; fi

echo "College detail and reviews"
check "top college" 200 GET "/api/colleges?limit=1"
SLUG=$(field "b.data[0].slug")
check "detail by slug" 200 GET "/api/colleges/$SLUG"
assert "detail has courses, placement and distribution" "b.data.courses.length >= 3 && b.data.placement && b.data.ratingDistribution.reduce((s, n) => s + n, 0) === b.data.ratingCount"
assert "reviews show first name and initial only" "b.data.reviews.every(r => /^\\S+( [A-Z]\\.)?$/.test(r.author))"
check "unknown slug" 404 GET "/api/colleges/no-such-college"
assert "404 envelope" "b.ok === false && b.error.code === 'NOT_FOUND'"
check "malformed slug" 404 GET "/api/colleges/Bad%20Slug!"
check "reviews page" 200 GET "/api/colleges/$SLUG/reviews?limit=2"
assert "reviews newest first" "b.data.length === 2 && b.data[0].createdAt >= b.data[1].createdAt"
REVIEW_CURSOR=$(field "b.meta.nextCursor")
check "reviews page 2" 200 GET "/api/colleges/$SLUG/reviews?limit=2&cursor=$REVIEW_CURSOR"
check "reviews bad limit" 400 GET "/api/colleges/$SLUG/reviews?limit=100"
check "reviews bad cursor" 400 GET "/api/colleges/$SLUG/reviews?cursor=abc"
check "reviews unknown college" 404 GET "/api/colleges/no-such-college/reviews"

echo "Filters"
check "filter options" 200 GET "/api/filters"
assert "15 states with counts" "b.data.states.length === 15 && b.data.states.every(s => s.count > 0)"

echo "Auth"
EMAIL="smoke-$(date +%s)-$RANDOM@example.com"
check "signup short password" 400 POST "/api/auth/signup" '{"name":"Smoke Test","email":"'"$EMAIL"'","password":"short"}'
check "signup invalid email" 400 POST "/api/auth/signup" '{"name":"Smoke Test","email":"not-an-email","password":"password123"}'
check "signup invalid json" 400 POST "/api/auth/signup" '{"name":'
check "signup" 201 POST "/api/auth/signup" '{"name":"Smoke Test","email":"'"$EMAIL"'","password":"password123"}'
assert "signup never returns the hash" "b.ok && b.data.email === '$EMAIL' && !('passwordHash' in b.data)"
UPPER_EMAIL=$(echo "$EMAIL" | tr '[:lower:]' '[:upper:]')
check "duplicate email (any case)" 409 POST "/api/auth/signup" '{"name":"Smoke Test","email":"'"$UPPER_EMAIL"'","password":"password123"}'
login "$EMAIL" "wrong-password"
check "wrong password gives no session" 200 GET "/api/auth/session"
assert "no session" "b === null || !b.user"
login "demo@collegepick.dev" "password123"
check "demo login" 200 GET "/api/auth/session"
assert "session has user id" "b.user && b.user.email === 'demo@collegepick.dev' && b.user.id"
logout
status=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "$BASE/saved")
if [[ "$status" == 307*"/login?next=%2Fsaved" ]]; then PASS=$((PASS + 1)); echo "  ok    307  /saved redirects to login"; else FAIL=$((FAIL + 1)); echo "  FAIL  /saved redirect: $status"; fi

echo "Compare"
check "three colleges for compare" 200 GET "/api/colleges?sort=name&limit=3"
A=$(field "b.data[0].slug"); B=$(field "b.data[1].slug"); C=$(field "b.data[2].slug"); D=$SLUG
A_ID=$(field "b.data[0].id")
check "compare 3" 200 GET "/api/colleges/compare?ids=$C,$A,$B"
assert "order preserved with placement" "b.data.map(c => c.slug).join() === '$C,$A,$B' && b.data.every(c => c.placement && c.degrees.length)"
check "compare 1" 400 GET "/api/colleges/compare?ids=$A"
check "compare none" 400 GET "/api/colleges/compare"
check "compare 4" 400 GET "/api/colleges/compare?ids=$A,$B,$C,$D"
check "compare duplicate" 400 GET "/api/colleges/compare?ids=$A,$A"
check "compare unknown" 404 GET "/api/colleges/compare?ids=$A,no-such-college"
assert "404 names the missing college" "b.error.message.includes('no-such-college')"
check "compare malformed id" 400 GET "/api/colleges/compare?ids=$A,Bad!Id"

echo "Protected endpoints (logged out)"
check "saved colleges" 401 GET "/api/saved/colleges"
check "save college" 401 POST "/api/saved/colleges" '{"collegeId":"'"$A_ID"'"}'
check "saved comparisons" 401 GET "/api/saved/comparisons"
check "post review" 401 POST "/api/colleges/$A/reviews" '{"rating":5,"title":"Great","body":"A long enough review body for validation to pass."}'

echo "Reviews (logged in)"
login "$EMAIL" "password123"
check "detail before review" 200 GET "/api/colleges/$A"
BEFORE_COUNT=$(field "b.data.ratingCount")
BEFORE_SUM=$(field "b.data.ratingDistribution.reduce((s, n, i) => s + n * (i + 1), 0)")
check "review invalid rating" 400 POST "/api/colleges/$A/reviews" '{"rating":7,"title":"Great","body":"A long enough review body for validation to pass."}'
assert "field errors in details" "b.error.details.some(d => d.path === 'rating')"
check "review invalid json" 400 POST "/api/colleges/$A/reviews" '{"rating":'
check "review" 201 POST "/api/colleges/$A/reviews" '{"rating":5,"title":"Smoke test review","body":"Checking that the rating recomputes inside the transaction."}'
assert "rating recomputed" "b.data.ratingCount === $BEFORE_COUNT + 1 && Math.abs(b.data.rating - ($BEFORE_SUM + 5) / ($BEFORE_COUNT + 1)) < 0.01 && b.data.review.isOwn"
check "duplicate review" 409 POST "/api/colleges/$A/reviews" '{"rating":4,"title":"Second try","body":"This should be rejected because one review per college."}'
check "reviews know the viewer" 200 GET "/api/colleges/$A/reviews"
assert "viewerHasReviewed" "b.meta.viewerHasReviewed === true && b.data.some(r => r.isOwn)"
got429=no
for _ in 1 2 3; do
  code=$(curl -s -o "$BODY" -w "%{http_code}" -b "$JAR" -c "$JAR" -X POST -H "Content-Type: application/json" --data '{}' "$BASE/api/colleges/$B/reviews")
  if [ "$code" = "429" ]; then got429=yes; break; fi
done
if [ "$got429" = "yes" ]; then PASS=$((PASS + 1)); echo "  ok    429  review rate limit"; else FAIL=$((FAIL + 1)); echo "  FAIL  review rate limit never triggered"; fi

echo "Saved colleges (logged in)"
check "save" 201 POST "/api/saved/colleges" '{"collegeId":"'"$A_ID"'"}'
check "save again is idempotent" 200 POST "/api/saved/colleges" '{"collegeId":"'"$A_ID"'"}'
check "list saved" 200 GET "/api/saved/colleges"
assert "saved list has the college once" "b.data.filter(c => c.id === '$A_ID').length === 1 && b.data[0].savedAt"
check "save unknown college" 404 POST "/api/saved/colleges" '{"collegeId":"does-not-exist"}'
check "save without body" 400 POST "/api/saved/colleges" '{}'
check "unsave" 200 DELETE "/api/saved/colleges?collegeId=$A_ID"
assert "removed" "b.data.removed === true"
check "unsave again is idempotent" 200 DELETE "/api/saved/colleges?collegeId=$A_ID"
assert "nothing removed" "b.data.removed === false"

echo "Saved comparisons (logged in)"
check "save comparison" 201 POST "/api/saved/comparisons" '{"slugs":["'"$A"'","'"$B"'","'"$C"'"]}'
CMP_ID=$(field "b.data.id")
check "same set, other order" 200 POST "/api/saved/comparisons" '{"slugs":["'"$C"'","'"$A"'","'"$B"'"]}'
assert "returns the existing comparison" "b.data.id === '$CMP_ID'"
check "save comparison of 1" 400 POST "/api/saved/comparisons" '{"slugs":["'"$A"'"]}'
check "list comparisons" 200 GET "/api/saved/comparisons"
assert "comparison listed with colleges in order" "b.data.length === 1 && b.data[0].colleges.map(c => c.slug).join() === '$A,$B,$C'"
login "demo@collegepick.dev" "password123"
check "someone else's comparison" 404 DELETE "/api/saved/comparisons?id=$CMP_ID"
login "$EMAIL" "password123"
check "delete comparison" 200 DELETE "/api/saved/comparisons?id=$CMP_ID"
check "delete again" 404 DELETE "/api/saved/comparisons?id=$CMP_ID"
logout

echo "Predictor"
check "predict JEE Main" 200 GET "/api/predict?exam=JEE_MAIN&rank=40000"
assert "bands respect the rank thresholds" "b.data.results.length > 0 && b.data.results.every(r => (r.band === 'reach' && r.closingRank >= 32000 && r.closingRank < 40000) || (r.band === 'good' && r.closingRank >= 40000 && r.closingRank < 52000) || (r.band === 'safe' && r.closingRank >= 52000))"
assert "counts cover the returned rows" "['reach','good','safe'].every(k => b.data.counts[k] >= b.data.results.filter(r => r.band === k).length)"
check "predict with state" 200 GET "/api/predict?exam=JEE_MAIN&rank=40000&state=Karnataka"
assert "state filter applied" "b.data.results.every(r => r.college.state === 'Karnataka')"
check "predict blank state is ignored" 200 GET "/api/predict?exam=NEET&rank=5000&state="
check "predict missing exam" 400 GET "/api/predict?rank=100"
check "predict unknown exam" 400 GET "/api/predict?exam=SAT&rank=100"
check "predict rank 0" 400 GET "/api/predict?exam=CAT&rank=0"
check "predict rank not a number" 400 GET "/api/predict?exam=CAT&rank=abc"

echo "Concurrent reviews keep the rating consistent"
JARS=()
for n in 1 2 3 4 5; do
  jar="$(mktemp)"
  JARS+=("$jar")
  email="smoke-par-$n-$(date +%s)-$RANDOM@example.com"
  curl -s -o /dev/null -X POST -H "Content-Type: application/json" \
    --data '{"name":"Parallel Tester","email":"'"$email"'","password":"password123"}' "$BASE/api/auth/signup"
  curl -s -b "$jar" -c "$jar" -o "$BODY" "$BASE/api/auth/csrf"
  csrf=$(field "b.csrfToken")
  curl -s -b "$jar" -c "$jar" -o /dev/null -X POST --data-urlencode "csrfToken=$csrf" \
    --data-urlencode "email=$email" --data-urlencode "password=password123" "$BASE/api/auth/callback/credentials"
done
for n in 1 2 3 4 5; do
  curl -s -o /dev/null -b "${JARS[$((n - 1))]}" -X POST -H "Content-Type: application/json" \
    --data '{"rating":'"$n"',"title":"Parallel review","body":"Posted at the same moment as four others to test locking."}' \
    "$BASE/api/colleges/$C/reviews" &
done
wait
rm -f "${JARS[@]}"
check "detail after parallel reviews" 200 GET "/api/colleges/$C"
assert "rating equals the average of all reviews" "(() => { const d = b.data.ratingDistribution; const n = d.reduce((s, x) => s + x, 0); const avg = d.reduce((s, x, i) => s + x * (i + 1), 0) / n; return n === b.data.ratingCount && Math.abs(avg - b.data.rating) < 0.01; })()"

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
