#!/usr/bin/env bash
# API smoke checks: happy paths plus the edge cases (400/401/404/409/429).
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

field() {
  node -e "const b=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log($1)" "$BODY"
}

# Auth.js credentials flow (CSRF token + callback); the session cookie lands in $JAR.
login() {
  curl -s -b "$JAR" -c "$JAR" -o "$BODY" "$BASE/api/auth/csrf"
  local csrf
  csrf=$(field "b.csrfToken")
  curl -s -b "$JAR" -c "$JAR" -o /dev/null -X POST \
    --data-urlencode "csrfToken=$csrf" --data-urlencode "email=$1" --data-urlencode "password=$2" \
    "$BASE/api/auth/callback/credentials"
}

logout() { : > "$JAR"; }

echo "List"
check "default list" 200 GET "/api/learn"
assert "12 items with total" "b.ok && b.data.length === 12 && b.meta.total >= 80"
TOTAL=$(field "b.meta.total")
check "type tab value" 200 GET "/api/learn?type=courses"
assert "only courses" "b.data.length > 0 && b.data.every(r => r.type === 'COURSE')"
check "enum type" 200 GET "/api/learn?type=EBOOK"
assert "only ebooks" "b.data.every(r => r.type === 'EBOOK')"
check "combined filters" 200 GET "/api/learn?level=BEGINNER,INTERMEDIATE&pricing=FREE&sort=rating"
assert "filters applied and sorted by rating" "b.data.every((r, i, a) => ['BEGINNER','INTERMEDIATE'].includes(r.level) && r.pricing === 'FREE' && (i === 0 || a[i-1].ratingAvg >= r.ratingAvg))"
check "repeated params" 200 GET "/api/learn?format=VIDEO&format=PDF"
assert "format in list" "b.data.every(r => ['VIDEO','PDF'].includes(r.format))"
check "category" 200 GET "/api/learn?category=llms"
assert "category matches" "b.data.length > 0 && b.data.every(r => r.category.slug === 'llms')"
check "duration bucket" 200 GET "/api/learn?duration=lt1&sort=shortest"
assert "under an hour, shortest first" "b.data.every((r, i, a) => r.durationMinutes < 60 && (i === 0 || a[i-1].durationMinutes <= r.durationMinutes))"
check "search" 200 GET "/api/learn?q=prompt"
assert "search matches" "b.data.length > 0"
check "limit clamped to 24" 200 GET "/api/learn?limit=500"
assert "24 items" "b.data.length === 24"
check "limit=0" 400 GET "/api/learn?limit=0"
check "unknown sort" 400 GET "/api/learn?sort=cheapest"
assert "error envelope" "b.ok === false && b.error.code === 'BAD_REQUEST' && b.error.fieldErrors.sort"
check "unknown type" 400 GET "/api/learn?type=podcasts"
check "unknown level" 400 GET "/api/learn?level=EXPERT"
check "malformed cursor" 400 GET "/api/learn?cursor=nope"

echo "Cursor pagination"
for sort in trending newest rating saved shortest; do
  check "page 1 ($sort)" 200 GET "/api/learn?sort=$sort&limit=7"
  first_ids=$(field "b.data.map(r => r.id).join(',')")
  cursor=$(field "b.meta.nextCursor")
  check "page 2 ($sort)" 200 GET "/api/learn?sort=$sort&limit=7&cursor=$cursor"
  assert "no overlap ($sort)" "b.data.length === 7 && b.data.every(r => !'$first_ids'.split(',').includes(r.id))"
done
check "walk all pages" 200 GET "/api/learn?limit=24&sort=newest"
seen=$(field "b.data.length")
cursor=$(field "b.meta.nextCursor")
while [ "$cursor" != "null" ]; do
  curl -s -o "$BODY" "$BASE/api/learn?limit=24&sort=newest&cursor=$cursor"
  seen=$((seen + $(field "b.data.length")))
  cursor=$(field "b.meta.nextCursor")
done
if [ "$seen" = "$TOTAL" ]; then PASS=$((PASS + 1)); echo "  ok    ---  walked $seen rows, no gaps"; else FAIL=$((FAIL + 1)); echo "  FAIL  ---  walked $seen rows, expected $TOTAL"; fi

echo "Facets, categories, providers, suggest"
check "facets" 200 GET "/api/learn/facets?type=courses"
assert "type counts ignore the type filter" "b.data.type.length === 5 && b.data.type.reduce((s, t) => s + t.count, 0) === $TOTAL && b.data.category.length === 10"
check "categories" 200 GET "/api/learn/categories"
assert "10 categories with counts" "b.data.length === 10 && b.data.every(c => c.count > 0)"
check "providers" 200 GET "/api/learn/providers"
check "suggest" 200 GET "/api/learn/suggest?q=deep"
assert "suggestions" "b.data.resources.length + b.data.providers.length > 0"
check "suggest empty" 400 GET "/api/learn/suggest?q="

echo "Detail"
check "top resource" 200 GET "/api/learn?limit=3&sort=rating"
SLUG=$(field "b.data[0].slug"); SLUG2=$(field "b.data[1].slug")
check "detail" 200 GET "/api/learn/$SLUG"
assert "sections, distribution, viewer" "b.data.sections.length >= 2 && b.data.ratingDistribution.reduce((s, n) => s + n, 0) === b.data.ratingCount && b.meta.viewer.saved === false"
LESSON=$(field "b.data.sections[0].lessons[0].id")
check "unknown slug" 404 GET "/api/learn/no-such-resource"
check "malformed slug" 404 GET "/api/learn/Bad%20Slug!"
check "related" 200 GET "/api/learn/$SLUG/related"
assert "4 related, not itself" "b.data.length === 4 && b.data.every(r => r.slug !== '$SLUG')"
check "reviews page" 200 GET "/api/learn/$SLUG/reviews?limit=2"
assert "newest first" "b.data.length === 2 && b.data[0].createdAt >= b.data[1].createdAt"
check "reviews bad limit" 400 GET "/api/learn/$SLUG/reviews?limit=100"

echo "Protected (logged out)"
check "save" 401 PUT "/api/learn/$SLUG/save"
check "progress" 401 PUT "/api/learn/$SLUG/progress" '{"start":true}'
check "library" 401 GET "/api/learn/library"
check "review" 401 POST "/api/learn/$SLUG/reviews" '{"rating":5,"title":"Great","body":"A long enough review body for validation."}'
check "submit" 401 POST "/api/learn/submit" '{}'

echo "Auth"
EMAIL="smoke-$(date +%s)-$RANDOM@example.com"
check "signup short password" 400 POST "/api/auth/signup" '{"name":"Smoke Test","email":"'"$EMAIL"'","password":"short"}'
check "signup" 201 POST "/api/auth/signup" '{"name":"Smoke Test","email":"'"$EMAIL"'","password":"password123"}'
check "duplicate email" 409 POST "/api/auth/signup" '{"name":"Smoke Test","email":"'"$EMAIL"'","password":"password123"}'
login "$EMAIL" "wrong-password"
check "wrong password has no session" 200 GET "/api/auth/session"
assert "no session" "b === null || !b.user"
login "$EMAIL" "password123"
check "session" 200 GET "/api/auth/session"
assert "session user" "b.user && b.user.email === '$EMAIL'"

echo "Save, progress, review (logged in)"
check "save" 200 PUT "/api/learn/$SLUG/save"
assert "saved" "b.data.saved === true && b.data.saveCount >= 1"
check "save again is idempotent" 200 PUT "/api/learn/$SLUG/save"
check "saved slugs" 200 GET "/api/learn/saved"
assert "contains slug" "b.data.includes('$SLUG')"
check "save unknown" 404 PUT "/api/learn/no-such-resource/save"
check "progress start" 200 PUT "/api/learn/$SLUG/progress" '{"start":true}'
assert "started at 0" "b.data.status === 'STARTED' && b.data.percent === 0"
check "tick lesson" 200 PUT "/api/learn/$SLUG/progress" '{"lessonId":"'"$LESSON"'","done":true}'
assert "percent grows" "b.data.percent > 0 && b.data.completedLessonIds.includes('$LESSON')"
check "foreign lesson" 400 PUT "/api/learn/$SLUG2/progress" '{"lessonId":"'"$LESSON"'","done":true}'
check "bad body" 400 PUT "/api/learn/$SLUG/progress" '{"foo":1}'
check "complete" 200 PUT "/api/learn/$SLUG/progress" '{"complete":true}'
assert "completed at 100" "b.data.status === 'COMPLETED' && b.data.percent === 100"
check "library" 200 GET "/api/learn/library"
assert "in saved and completed" "b.data.saved.some(r => r.slug === '$SLUG') && b.data.completed.some(r => r.slug === '$SLUG')"
check "detail before review" 200 GET "/api/learn/$SLUG"
BEFORE=$(field "b.data.ratingCount")
check "review invalid" 400 POST "/api/learn/$SLUG/reviews" '{"rating":9,"title":"x","body":"short"}'
assert "field errors" "b.error.details.some(d => d.path === 'rating')"
check "review" 201 POST "/api/learn/$SLUG/reviews" '{"rating":5,"title":"Smoke test review","body":"Checking the average recomputes inside the transaction."}'
assert "count +1" "b.data.ratingCount === $BEFORE + 1 && b.data.review.isOwn"
check "duplicate review" 409 POST "/api/learn/$SLUG/reviews" '{"rating":4,"title":"Second try","body":"This should be rejected, one review per resource."}'
check "unsave" 200 DELETE "/api/learn/$SLUG/save"
assert "unsaved" "b.data.saved === false"
check "reset progress" 200 DELETE "/api/learn/$SLUG/progress"

echo "Submit"
check "submit invalid" 400 POST "/api/learn/submit" '{"title":"Hi","url":"nope","type":"COURSE","category":"llms","level":"BEGINNER","pricing":"FREE","description":"short","provider":"X"}'
assert "field errors for title, url, description" "['title','url','description'].every(k => b.error.fieldErrors[k])"
check "submit unknown category" 400 POST "/api/learn/submit" '{"title":"A real course title","url":"https://example.com/c","type":"COURSE","category":"not-a-category","level":"BEGINNER","pricing":"FREE","description":"'"$(printf 'x%.0s' {1..90})"'","provider":"Example"}'
DESC="A hands-on course that walks through building retrieval augmented generation apps from scratch with evaluations."
for n in 1 2 3 4 5; do
  check "submit $n" 201 POST "/api/learn/submit" '{"title":"Smoke submission '"$n"'","url":"https://example.com/course-'"$n"'","type":"COURSE","category":"llms","level":"BEGINNER","pricing":"FREE","description":"'"$DESC"'","provider":"Example Academy"}'
done
check "sixth submit is rate limited" 429 POST "/api/learn/submit" '{"title":"Smoke submission 6","url":"https://example.com/course-6","type":"COURSE","category":"llms","level":"BEGINNER","pricing":"FREE","description":"'"$DESC"'","provider":"Example Academy"}'
check "pending not listed" 200 GET "/api/learn?q=Smoke%20submission"
assert "no pending rows" "b.data.length === 0"
logout

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
