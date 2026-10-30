# Lab 03 – Answers

Final result: 6 tests passed, 0 skipped.

## Mission 1

**Why getByRole / getByTestId instead of XPath?**
getByRole finds things the way a user sees them, like "the checkbox called Available bikes only". If someone changes the CSS or moves a div around, the test still works. XPath like `//div[3]/article[2]` breaks as soon as the layout changes, even if the app is fine. getByTestId is also stable because it's only there for tests.

**Config notes:**
- runner: @playwright/test, tests are in ./tests
- baseURL: http://127.0.0.1:4173
- webServer: runs `npm run start` and waits for /health before the tests start
- screenshot: only when a test fails
- trace: kept only when a test fails
- in CI it does 1 retry and uses 1 worker

**A) What does a green smoke test prove?**
That the app starts and the basic stuff works (page loads, 4 stations, search). It doesn't mean there are no bugs. The smoke tests were green and BUG-101 was still there.

**B) Why no fixed sleeps?**
A sleep is either too short and the test gets flaky, or too long and wastes time. expect() already waits until the thing is true, so it's faster and more reliable.

**C) What is a quality gate for?**
It stops code from getting merged into main if the tests fail, so bugs get caught before users see them.

## Mission 2 – BUG-101

- Steps: open the page, wait for the 4 stations, tick "Available bikes only"
- Expected: 3 stations, Riverside Park (0 bikes) hidden
- Actual: still 4 stations and Riverside Park is still showing

The test failed first with "Expected 3, Received 4" (screenshot in the evidence folder).

The problem was in app.js: the check was `s.bikes < 0`. Bikes can never be negative, so nothing ever got filtered out. I changed it to `s.bikes < 1` and the test passed.

## Mission 3

- Invalid email test: I typed a wrong email, clicked confirm, and checked that the error message shows and that no POST request was sent.
- Success test: I used page.route to catch the POST and send back a fake 201 with CB-DEMO-777. Then I checked the page shows the ID and that the request had stationId "central" and email "student@example.com".

## Mission 4

The first request to /api/stations gets a fake 503 and the second one goes to the real server. The test checks the "Unable to load stations." message, clicks Retry loading, and then checks there are 4 stations and the error is gone.

**Why mock it?** You can't control when a real outage happens, and breaking a shared server would mess up other people. With a mock you get the same 503 every time, so the test is repeatable.

## Mission 5 – workflow

- runs on pull requests to main
- checkout, then setup-node with Node 22
- `npm ci` installs the exact versions from the lockfile
- installs Chromium with `--with-deps`
- runs `npx playwright test`. If a test fails, the job fails and the PR shows red.
- uploads the HTML report with `if: !cancelled()`, so it still uploads when tests fail

I also checked this by putting the bug back on purpose: the test failed, then I put the fix back.

## Exit ticket

**What should happen when CI is red?** Don't merge. Look at the report or screenshot, figure out whether it's a real bug or a bad test, fix it, and push again. Don't just skip the test.

**Why test recovery after a 503?** Servers go down sometimes, and the user should see an error and be able to retry instead of a blank page. Without the test, someone could break the retry button and nobody would notice until a real outage.
