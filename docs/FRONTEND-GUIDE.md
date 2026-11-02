# Frontend guide

index.html is the Vue template, app.js holds reactive state/computed values/methods and style.css controls appearance.

## sendClientEvent()

- Purpose: Reports meaningful UI activity without blocking the app.
- Inputs: event, action, target, details
- Changes / returns: No application state; returns immediately.
- Called from: Buttons, input handlers and mounted.
- Network / database: POST /client-events; no database writes.
- Failure handling: The fetch rejection is caught so logging failure cannot stop shopping.

## imageUrl()

- Purpose: Builds the URL served by Express static middleware.
- Inputs: Image filename
- Changes / returns: Returns API_BASE_URL + /images/ + filename.
- Called from: Image :src bindings.
- Network / database: The browser subsequently GETs the image.
- Failure handling: A missing image receives the clear API 404 fallback.

## logSortChange()

- Purpose: Reports the chosen sort field.
- Inputs: Reads sortBy
- Changes / returns: No data changes.
- Called from: Sort select @change.
- Network / database: Calls sendClientEvent.
- Failure handling: Logging errors are ignored.

## logSortOrderChange()

- Purpose: Reports the chosen direction.
- Inputs: Reads sortOrder
- Changes / returns: No data changes.
- Called from: Order select @change.
- Network / database: Calls sendClientEvent.
- Failure handling: Logging errors are ignored.

## backToLessons()

- Purpose: Returns from My Enrolments to the catalogue.
- Inputs: No arguments
- Changes / returns: Sets both view flags false.
- Called from: Browse Lessons button.
- Network / database: Only client-event logging.
- Failure handling: Blocked while a checkout is in flight or needs retry.

## loadMyEnrolments()

- Purpose: Rebuilds the active enrolment list from Atlas.
- Inputs: enrolmentLookupPhone
- Changes / returns: Sets myEnrolments, loaded/loading flags and messages.
- Called from: Lookup button, Enter, checkout and deEnrol.
- Network / database: GET /my-enrolments?phone=; backend reads order and lesson.
- Failure handling: Rejects non-digits locally; displays failed HTTP/network messages; finally clears loading.

## prepareLessons()

- Purpose: Preserves local cart deductions and shares lesson objects across views.
- Inputs: Fresh server lesson array
- Changes / returns: Returns cached reactive lesson objects with server space minus cart quantity.
- Called from: loadLessons, searchLessons and loadTeacherLessons.
- Network / database: No request or database write.
- Failure handling: Assumes the server returned valid lesson values; API validation protects new updates.

## changeDisplayedSpace()

- Purpose: Changes one shared displayed availability exactly once.
- Inputs: lessonId, signed amount
- Changes / returns: Updates the cached lesson space, never below zero.
- Called from: addToCart and removeFromCart.
- Network / database: Browser-only state.
- Failure handling: Does nothing if that lesson is absent from the cache.

## loadLessons()

- Purpose: Loads the complete lesson catalogue.
- Inputs: No arguments
- Changes / returns: Sets lessons, cache, loading and error state.
- Called from: mounted, empty/clear search, checkout and deEnrol.
- Network / database: GET /lessons → lesson.find({}).
- Failure handling: Checks response.ok; only the newest request may change the result.

## queueSearch()

- Purpose: Waits for a pause in typing before querying the server.
- Inputs: Reads searchText
- Changes / returns: Cancels the old timer and creates a new 350ms timer.
- Called from: Search @input.
- Network / database: Later calls searchLessons.
- Failure handling: Rapid typing replaces the previous timer instead of sending every keystroke to search.

## searchLessons()

- Purpose: Queries all required attributes on the backend.
- Inputs: searchText
- Changes / returns: Sets displayed search results, shared cache and loading/error state.
- Called from: Search button, Enter or debounce timer.
- Network / database: GET /search?q= with encodeURIComponent.
- Failure handling: Checks HTTP status; request numbers prevent an old response replacing a newer result.

## clearSearch()

- Purpose: Resets search text and restores all lessons.
- Inputs: No arguments
- Changes / returns: Clears the pending timer and searchText; returns loadLessons Promise.
- Called from: Clear button.
- Network / database: GET /lessons.
- Failure handling: Uses loadLessons error handling and preserves cart deductions.

## addToCart()

- Purpose: Selects exactly one available space.
- Inputs: Lesson object
- Changes / returns: Pushes one copy to cart and subtracts one cached displayed space.
- Called from: Catalogue or teacher-card Add button.
- Network / database: Only client-event logging until checkout.
- Failure handling: Rejects sold-out lessons and edits during pending checkout.

## removeFromCart()

- Purpose: Removes one cart entry and restores one displayed space.
- Inputs: Cart array index
- Changes / returns: Adds one displayed space, splices one entry, exits the cart if empty.
- Called from: Remove button.
- Network / database: Only client-event logging; no Atlas mutation.
- Failure handling: Blocked while submitting or when a saved checkout still needs retry.

## toggleCart()

- Purpose: Switches between the catalogue and cart.
- Inputs: No arguments
- Changes / returns: Toggles showCart; hides My Enrolments when opening cart.
- Called from: Header Cart button.
- Network / database: Only client-event logging.
- Failure handling: Does nothing with an empty cart or pending checkout.

## toggleEnrolments()

- Purpose: Opens or closes the enrolment lookup view.
- Inputs: No arguments
- Changes / returns: Toggles showEnrolments and hides cart.
- Called from: Header My Enrolments button.
- Network / database: Only client-event logging; lookup remains an explicit action.
- Failure handling: Blocked during pending checkout.

## loadTeachers()

- Purpose: Loads teacher documents for the dropdown.
- Inputs: No arguments
- Changes / returns: Sets teachers or teacherError.
- Called from: mounted.
- Network / database: GET /teachers → teacher.find({}).
- Failure handling: Handles unsuccessful HTTP responses and network failures.

## loadTeacherLessons()

- Purpose: Loads all lessons linked to the selected teacher.
- Inputs: selectedTeacherId
- Changes / returns: Sets teacherLessons, cache and teacher loading/error state.
- Called from: Teacher @change and post-purchase refresh.
- Network / database: GET /teachers/:id/lessons → teacher.findOne then lesson.find($in).
- Failure handling: Empty selection clears results; request IDs reject stale results after another selection.

## loadEnrolment()

- Purpose: Loads the purchased-space total for one lesson.
- Inputs: Lesson ID string
- Changes / returns: Stores enrolment[id].
- Called from: View Enrolment button and deEnrol refresh.
- Network / database: GET /enrolment/:lessonid → order quantity sum.
- Failure handling: Shows an error for failed HTTP/network responses.

## checkout()

- Purpose: Saves a grouped order, persists final spaces and shows confirmation.
- Inputs: Cart, valid customerName and customerPhone
- Changes / returns: Creates/resumes pendingCheckout; clears cart after all PUTs; opens My Enrolments.
- Called from: Checkout or Retry checkout button.
- Network / database: GET current stock; POST /orders; PUT each affected lesson; refresh GETs.
- Failure handling: Invalid input and duplicate clicks are rejected. A known successful POST is not repeated when an unfinished PUT is retried.

## deEnrol()

- Purpose: Cancels one purchased space and refreshes persistent state.
- Inputs: An enrolment item with orderId and lessonId
- Changes / returns: Reloads enrolments/catalogue/teacher cards and enrolment totals.
- Called from: De-enrol one space button.
- Network / database: DELETE /enrolments/:orderId/:lessonId → update order and $inc lesson.space.
- Failure handling: Handles failed responses, prevents duplicate clicks and always clears deEnrolling.
