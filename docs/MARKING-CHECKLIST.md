# Supplied coursework requirement checklist

Exact official marks are unknown; the original brief was not supplied. The complete test/audit report is in the shared supporting-files/guides folder.

- [x] 1. 10 lessons, initially five spaces — seed.js. Evidence: GET lessons; seed source. Art currently 4 because existing state was preserved.
- [x] 2. Topic, location, price, spaces, image — index.html / app.js. Evidence: Browser cards and loaded images. Meaningful subject SVG illustrations inspected.
- [x] 3. Vue v-for lesson display — index.html. Evidence: Source and rendered ten cards. No replacement framework.
- [x] 4. Four sort attributes and directions — app.js sortedLessons. Evidence: Eight real-browser combinations. Backend records are not rearranged or mutated.
- [x] 5. Add button visible; disabled at zero — index.html / addToCart. Evidence: Browser five additions and disabled visible button. Server rejects new negative space updates.
- [x] 6. One click adds one entry and deducts one — app.js addToCart. Evidence: Browser and regression suite. Teacher and catalogue share one displayed object.
- [x] 7. Cart disabled empty; toggles when enabled — index.html / toggleCart. Evidence: Browser empty/add/remove; source guards. Temporary checkout lock prevents edits during a pending saved purchase.
- [x] 8. Cart rows and removal restore one — index.html / removeFromCart. Evidence: Browser plus search/reload regression. Original overselling/reset bug fixed.
- [x] 9. Checkout inside cart — index.html. Evidence: Source and browser. Layout preserved.
- [x] 10. Name letters/spaces; phone digits; JS — app.js computed validation. Evidence: Invalid/valid browser inputs. Character checks are not identity verification.
- [x] 11. Checkout visible; enabled only when valid — index.html / canCheckout. Evidence: Browser invalid/valid button states. submitting also prevents duplicate clicks.
- [x] 12. POST order, PUT final stock, confirmation — app.js checkout / server.js. Evidence: Browser real checkout; API POST/PUT; retry regression. Cross-request transaction/idempotency limitations remain documented.
- [x] 13. lesson, teacher, order collections — server.js / seed.js / export.js. Evidence: Atlas exports and API reads. No database replacement.
- [x] 14. Logger for all method/URL requests — server.js middleware. Evidence: OPTIONS/SSE/malformed JSON API checks. Error statuses labelled WARNING or ERROR.
- [x] 15. Static images and clear missing 404 — server.js / public/images. Evidence: Browser ten images; Postman valid/missing image. No fabricated image host.
- [x] 16. GET /lessons JSON — server.js. Evidence: Local/hosted GET All Lessons. Ten records observed.
- [x] 17. POST /orders saves order — server.js. Evidence: Real checkout and Postman assertions. New orders require items; invalid bodies rejected.
- [x] 18. PUT any allowed lesson attribute — server.js. Evidence: Space and price Postman requests. Allowed values validated; unknown fields never set.
- [x] 19. Backend search across four attributes — server.js / searchLessons. Evidence: math, Hendon, 100, 5 against real API/browser. Search button, Enter and 350ms typing debounce preserved.
- [x] 20. Select teacher and see all linked lessons — server.js / loadTeacherLessons. Evidence: Three Aisha lessons and browser teacher cards. Stale response guard and shared availability.
- [x] 21. GET enrolment purchased-space total — server.js / loadEnrolment. Evidence: Real purchase total and Postman numeric assertion. Legacy multi-lesson orders without quantities are ambiguous.

Keep the required stack and both repository histories. Existing purchases mean current spaces need not all remain five. Never reset Atlas to make a checklist appear clean. Known multi-user/authentication/transaction limits are documented in the full guide.
