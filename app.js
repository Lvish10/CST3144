const API_BASE_URL =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://m01016510-after-school.onrender.com';

const app = Vue.createApp({
  data() {
    return {
      lessons: [],
      lessonCache: {},
      lessonRequest: 0,
      teacherRequest: 0,
      pendingCheckout: null,
      cart: [],
      teachers: [],
      teacherLessons: [],
      enrolment: {},
      myEnrolments: [],
      enrolmentLookupPhone: '',
      showCart: false,
      showEnrolments: false,
      searchText: '',
      sortBy: 'topic',
      sortOrder: 'asc',
      selectedTeacherId: '',
      customerName: '',
      customerPhone: '',
      loading: false,
      submitting: false,
      deEnrolling: false,
      teacherLoading: false,
      enrolmentLoading: false,
      enrolmentsLoaded: false,
      errorMessage: '',
      teacherError: '',
      confirmationMessage: '',
      enrolmentMessage: '',
      searchTimer: null
    };
  },

  computed: {
    sortedLessons() {
      return [...this.lessons].sort((a, b) => {
        let x = a[this.sortBy];
        let y = b[this.sortBy];

        if (typeof x === 'string') {
          x = x.toLowerCase();
          y = y.toLowerCase();
        }

        if (x < y) return this.sortOrder === 'asc' ? -1 : 1;
        if (x > y) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },

    selectedTeacher() {
      return this.teachers.find(
        teacher => teacher._id === this.selectedTeacherId
      ) || null;
    },

    validName() {
      return /^[A-Za-z ]+$/.test(this.customerName) &&
        this.customerName.length > 0;
    },

    validPhone() {
      return /^\d+$/.test(this.customerPhone) &&
        this.customerPhone.length > 0;
    },

    canCheckout() {
      return this.cart.length > 0 &&
        this.validName &&
        this.validPhone;
    },

    cartTotal() {
      return this.cart.reduce(
        (total, item) => total + Number(item.price),
        0
      );
    },

    myEnrolmentCount() {
      return this.myEnrolments.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      );
    },

    nameMessage() {
      if (!this.customerName) return 'Enter your name';

      return this.validName
        ? 'Valid name'
        : 'Use letters and spaces only';
    },

    phoneMessage() {
      if (!this.customerPhone) return 'Enter your phone number';

      return this.validPhone
        ? 'Valid phone'
        : 'Use numbers only';
    }
  },

  methods: {
    sendClientEvent(event, action, target, details = {}) {
      fetch(`${API_BASE_URL}/client-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event,
          action,
          target,
          details
        })
      }).catch(() => {
        // Logging must never interrupt the application.
      });
    },

    imageUrl(name) {
      return `${API_BASE_URL}/images/${name}`;
    },

    logSortChange() {
      this.sendClientEvent(
        'change',
        'Sort field changed',
        'Sort by',
        { sortBy: this.sortBy }
      );
    },

    logSortOrderChange() {
      this.sendClientEvent(
        'change',
        'Sort order changed',
        'Sort order',
        { sortOrder: this.sortOrder }
      );
    },

    backToLessons() {
      if (this.submitting || this.pendingCheckout) return;
      this.sendClientEvent(
        'click',
        'Browse Lessons clicked',
        'Browse Lessons button'
      );

      this.showEnrolments = false;
      this.showCart = false;

      this.sendClientEvent(
        'navigation',
        'Lesson page opened',
        'Main view'
      );
    },

    async loadMyEnrolments() {
      this.sendClientEvent(
        'click',
        'Load My Enrolments clicked',
        'My Enrolments lookup'
      );

      this.errorMessage = '';
      this.enrolmentMessage = '';
      this.myEnrolments = [];
      this.enrolmentsLoaded = false;

      if (!/^\d+$/.test(this.enrolmentLookupPhone)) {
        this.errorMessage = 'Enter the phone number used at checkout.';
        return;
      }

      this.enrolmentLoading = true;

      try {
        const response = await fetch(
          `${API_BASE_URL}/my-enrolments?phone=${encodeURIComponent(this.enrolmentLookupPhone)}`
        );

        if (!response.ok) {
          throw new Error('Could not load enrolments');
        }

        const data = await response.json();
        this.myEnrolments = data.enrolments;
        this.enrolmentsLoaded = true;

        this.sendClientEvent(
          'success',
          'My Enrolments loaded from Atlas',
          'My Enrolments',
          { enrolmentEntries: this.myEnrolments.length, totalSpaces: this.myEnrolmentCount }
        );

        if (!this.myEnrolments.length) {
          this.enrolmentMessage =
            'No active enrolments were found for this phone number.';
        }
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.enrolmentLoading = false;
      }
    },

    prepareLessons(rows) {
      // Both views share each lesson object. Server stock excludes this cart.
      return rows.map(row => {
        const selected = this.cart.filter(item => item._id === row._id).length;
        const values = { ...row, space: Math.max(0, Number(row.space) - selected) };
        if (this.lessonCache[row._id]) {
          Object.assign(this.lessonCache[row._id], values);
        } else {
          this.lessonCache[row._id] = values;
        }
        return this.lessonCache[row._id];
      });
    },

    changeDisplayedSpace(lessonId, amount) {
      const lesson = this.lessonCache[lessonId];
      if (lesson) lesson.space = Math.max(0, Number(lesson.space) + amount);
    },

    async loadLessons() {
      const request = ++this.lessonRequest;
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(`${API_BASE_URL}/lessons`);

        if (!response.ok) {
          throw new Error('Could not load lessons');
        }

        const rows = await response.json();
        if (request === this.lessonRequest) this.lessons = this.prepareLessons(rows);
      } catch (error) {
        if (request === this.lessonRequest) this.errorMessage = error.message;
      } finally {
        if (request === this.lessonRequest) this.loading = false;
      }
    },

    queueSearch() {
      this.sendClientEvent(
        'input',
        'User typed in lesson search',
        'Search box',
        { searchLength: this.searchText.length }
      );

      clearTimeout(this.searchTimer);

      this.searchTimer = setTimeout(() => {
        this.searchLessons();
      }, 350);
    },

    async searchLessons() {
      clearTimeout(this.searchTimer);
      this.sendClientEvent(
        'search',
        'Search requested',
        'Lesson search',
        { query: this.searchText || '(empty)' }
      );

      if (!this.searchText) {
        return this.loadLessons();
      }

      const request = ++this.lessonRequest;
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(
          `${API_BASE_URL}/search?q=${encodeURIComponent(this.searchText)}`
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const rows = await response.json();
        if (request === this.lessonRequest) this.lessons = this.prepareLessons(rows);
      } catch (error) {
        if (request === this.lessonRequest) this.errorMessage = error.message;
      } finally {
        if (request === this.lessonRequest) this.loading = false;
      }
    },

    clearSearch() {
      this.sendClientEvent(
        'click',
        'Search cleared',
        'Clear button'
      );

      this.searchText = '';
      clearTimeout(this.searchTimer);
      return this.loadLessons();
    },

    addToCart(lesson) {
      if (this.submitting || this.pendingCheckout) return;
      this.sendClientEvent(
        'click',
        'Add to Cart clicked',
        lesson.topic,
        { lessonId: lesson._id, availableBefore: lesson.space }
      );

      if (lesson.space <= 0) {
        this.sendClientEvent(
          'blocked',
          'Add to Cart blocked because lesson is sold out',
          lesson.topic,
          { lessonId: lesson._id }
        );
        return;
      }

      this.cart.push({ ...lesson });
      this.changeDisplayedSpace(lesson._id, -1);

      this.sendClientEvent(
        'cart',
        'Lesson added to cart',
        lesson.topic,
        { cartCount: this.cart.length }
      );
    },

    removeFromCart(index) {
      if (this.submitting || this.pendingCheckout) return;
      const removed = this.cart[index];

      this.sendClientEvent(
        'click',
        'Remove from Cart clicked',
        removed.topic,
        { lessonId: removed._id }
      );

      this.changeDisplayedSpace(removed._id, 1);
      this.cart.splice(index, 1);

      this.sendClientEvent(
        'cart',
        'Lesson removed from cart',
        removed.topic,
        { cartCount: this.cart.length }
      );

      if (!this.cart.length) {
        this.showCart = false;
      }
    },

    toggleCart() {
      if (this.submitting || this.pendingCheckout) return;
      this.sendClientEvent(
        'click',
        'Cart button clicked',
        'Cart button',
        { cartCount: this.cart.length }
      );

      if (!this.cart.length) return;

      this.showCart = !this.showCart;

      if (this.showCart) {
        this.showEnrolments = false;
      }

      this.sendClientEvent(
        'navigation',
        this.showCart ? 'Cart page opened' : 'Lesson page opened',
        'Main view'
      );
    },

    toggleEnrolments() {
      if (this.submitting || this.pendingCheckout) return;
      this.sendClientEvent(
        'click',
        'My Enrolments button clicked',
        'My Enrolments button'
      );

      this.showEnrolments = !this.showEnrolments;

      if (this.showEnrolments) {
        this.showCart = false;
        this.enrolmentMessage = '';
      }

      this.sendClientEvent(
        'navigation',
        this.showEnrolments ? 'My Enrolments page opened' : 'Lesson page opened',
        'Main view'
      );
    },

    async loadTeachers() {
      this.teacherError = '';

      try {
        const response = await fetch(`${API_BASE_URL}/teachers`);

        if (!response.ok) {
          throw new Error('Could not load teachers');
        }

        this.teachers = await response.json();
      } catch (error) {
        this.teacherError = error.message;
      }
    },

    async loadTeacherLessons() {
      const request = ++this.teacherRequest;
      this.sendClientEvent(
        'change',
        'Teacher selection changed',
        'Teacher dropdown',
        { teacherId: this.selectedTeacherId || '(none)' }
      );

      this.teacherLessons = [];
      this.teacherError = '';

      if (!this.selectedTeacherId) {
        this.teacherLoading = false;
        return;
      }

      this.teacherLoading = true;

      try {
        const response = await fetch(
          `${API_BASE_URL}/teachers/${this.selectedTeacherId}/lessons`
        );

        if (!response.ok) {
          throw new Error('Could not load teacher lessons');
        }

        const rows = await response.json();
        if (request !== this.teacherRequest) return;
        this.teacherLessons = this.prepareLessons(rows);

        this.sendClientEvent(
          'success',
          'Teacher lessons loaded',
          'Teacher section',
          { lessonCount: this.teacherLessons.length }
        );
      } catch (error) {
        if (request === this.teacherRequest) this.teacherError = error.message;
      } finally {
        if (request === this.teacherRequest) this.teacherLoading = false;
      }
    },

    async loadEnrolment(id) {
      this.sendClientEvent(
        'click',
        'View Enrolment clicked',
        'Lesson enrolment',
        { lessonId: id }
      );

      this.errorMessage = '';

      try {
        const response = await fetch(
          `${API_BASE_URL}/enrolment/${id}`
        );

        if (!response.ok) {
          throw new Error('Could not load enrolment');
        }

        const data = await response.json();
        this.enrolment[id] = data.enrolment;

        this.sendClientEvent(
          'success',
          'Enrolment total displayed',
          'Lesson enrolment',
          { lessonId: id, enrolment: data.enrolment }
        );
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async checkout() {
      this.sendClientEvent(
        'click',
        'Checkout button clicked',
        'Checkout',
        { cartCount: this.cart.length, validationPassed: this.canCheckout }
      );

      if (!this.canCheckout || this.submitting) return;

      this.submitting = true;
      this.errorMessage = '';
      this.confirmationMessage = '';

      try {
        if (!this.pendingCheckout) {
          const groups = {};
          this.cart.forEach(item => {
            groups[item._id] = (groups[item._id] || 0) + 1;
          });
          // Read current stock, including lessons hidden by the search results.
          const stockResponse = await fetch(`${API_BASE_URL}/lessons`);
          if (!stockResponse.ok) throw new Error('Could not check lesson availability');
          const stock = await stockResponse.json();
          const updates = Object.entries(groups).map(([lessonId, quantity]) => {
            const lesson = stock.find(item => item._id === lessonId);
            if (!lesson || lesson.space < quantity) {
              throw new Error('A selected lesson has insufficient spaces. Please update your cart.');
            }
            return { lessonId, space: lesson.space - quantity, done: false };
          });
          const order = {
            name: this.customerName,
            phone: this.customerPhone,
            lessonIDs: Object.keys(groups),
            numberOfSpaces: this.cart.length,
            items: Object.entries(groups).map(([lessonId, quantity]) => ({ lessonId, quantity }))
          };
          this.pendingCheckout = { order, updates, saved: false, orderId: null };
        }

        const pending = this.pendingCheckout;
        if (!pending.saved) {
          const orderResponse = await fetch(
            `${API_BASE_URL}/orders`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pending.order)
            }
          );
          if (!orderResponse.ok) throw new Error('Could not save the order');
          pending.saved = true;
          const orderResult = await orderResponse.json();
          pending.orderId = orderResult.orderId;
        }

        for (const update of pending.updates) {
          if (update.done) continue;
          const updateResponse = await fetch(
            `${API_BASE_URL}/lessons/${update.lessonId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                space: update.space
              })
            }
          );

          if (!updateResponse.ok) {
            throw new Error(
              'Order saved but lesson space update failed'
            );
          }
          update.done = true;
        }

        this.enrolmentLookupPhone = pending.order.phone;

        this.confirmationMessage =
          'Order submitted successfully.';

        this.sendClientEvent(
          'success',
          'Checkout completed',
          'Checkout',
          { purchasedSpaces: pending.order.numberOfSpaces, lessonTypes: pending.order.lessonIDs.length }
        );

        this.cart = [];
        this.pendingCheckout = null;
        this.enrolment = {};
        this.customerName = '';
        this.customerPhone = '';

        await this.loadLessons();

        if (this.selectedTeacherId) {
          await this.loadTeacherLessons();
        }
        await this.loadMyEnrolments();

        this.showCart = false;
        this.showEnrolments = true;
      } catch (error) {
        this.errorMessage = error.message;
        if (this.pendingCheckout && !this.pendingCheckout.saved) this.pendingCheckout = null;

        this.sendClientEvent(
          'error',
          'Checkout failed',
          'Checkout',
          { message: error.message }
        );
      } finally {
        this.submitting = false;
      }
    },

    async deEnrol(item) {
      if (this.deEnrolling || this.submitting || this.pendingCheckout) return;
      this.sendClientEvent(
        'click',
        'De-enrol button clicked',
        item.topic,
        { lessonId: item.lessonId, quantityBefore: item.quantity }
      );

      this.deEnrolling = true;
      this.errorMessage = '';
      this.enrolmentMessage = '';

      try {
        const response = await fetch(
          `${API_BASE_URL}/enrolments/${item.orderId}/${item.lessonId}`,
          {
            method: 'DELETE'
          }
        );

        if (!response.ok) {
          throw new Error('Could not de-enrol from this lesson');
        }

        this.enrolment = {};
        await this.loadMyEnrolments();

        await this.loadLessons();

        if (this.selectedTeacherId) {
          await this.loadTeacherLessons();
        }

        await this.loadEnrolment(item.lessonId);

        this.enrolmentMessage =
          'De-enrolled successfully. One space is available again in the lesson catalogue.';

        this.sendClientEvent(
          'success',
          'De-enrol completed',
          item.topic,
          { lessonId: item.lessonId }
        );

        this.showEnrolments = false;
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.deEnrolling = false;
      }
    }
  },

  mounted() {
    this.sendClientEvent(
      'page',
      'Frontend loaded',
      'AfterClass application',
      { host: location.hostname }
    );

    this.loadLessons();
    this.loadTeachers();
  }
});

app.mount('#app');
