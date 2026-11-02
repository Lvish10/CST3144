# How AfterClass works

Browser → Vue 3 → native fetch → Express on Render → native mongodb driver → MongoDB Atlas. GitHub Pages hosts only frontend files. Local development uses Live Server and localhost:3000, while still reading the same cloud Atlas database.

## Page load

mounted → log page + GET lessons/teachers → find({}) → arrays → cards/dropdown → CLIENT/DATABASE logs

## Search

input → queueSearch → GET search → $or query → matching rows → cards → search/match logs

## Sort

select change → v-model + computed sort → no data mutation in Atlas → reordered cards → client change log

## Teacher selection

change → loadTeacherLessons → GET teacher lessons → teacher and lesson queries → full cards → linked-count logs

## Add to cart

click → addToCart → temporary cart/cache change → no order insert → count/space updates → CLIENT cart log

## Remove from cart

click → removeFromCart → restore one UI space → no database write → row removed → CLIENT cart log

## Checkout

click → stock GET + order POST + lesson PUTs → Atlas insert/update → confirmation/My Enrolments → masked order and success logs

## View enrolment

click → GET enrolment → matching order quantities → count → card result → DATABASE running-total logs

## My Enrolments

phone lookup → GET my-enrolments → order query + lesson joins → active item cards → masked lookup logs

## De-enrol

click → DELETE one purchased space → conditional order update + lesson $inc → refreshed views → restoration logs

## Postman request

Send → same HTTP route → same middleware/query → status/body/assertions → same backend logs

## Image load

img src → GET /images/file → express.static → SVG bytes → browser image → static route logs

## Missing image

GET unknown image → static misses → fallback JSON 404 → failed image response → WARNING log

The full offline HTML/PDF guide in supporting-files/guides explains every reactive variable, computed value, method, backend route, query and known limitation.
