const API_BASE_URL =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://m01016510-after-school.onrender.com';

const app = Vue.createApp({
  data() {
    return {
      lessons: [],
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

    changeDisplayedSpace(lessonId, amount) {
      const lists = [this.lessons, this.teacherLessons];

      lists.forEach(list => {
        const lesson = list.find(item => item._id === lessonId);

        if (lesson) {
          lesson.space = Math.max(
            0,
            Math.min(5, Number(lesson.space) + amount)
          );
        }
      });
    },

    async loadLessons() {
      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(`${API_BASE_URL}/lessons`);

        if (!response.ok) {
          throw new Error('Could not load lessons');
        }

        this.lessons = await response.json();
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
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
      this.sendClientEvent(
        'search',
        'Search requested',
        'Lesson search',
        { query: this.searchText || '(empty)' }
      );

      if (!this.searchText) {
        return this.loadLessons();
      }

      this.loading = true;
      this.errorMessage = '';

      try {
        const response = await fetch(
          `${API_BASE_URL}/search?q=${encodeURIComponent(this.searchText)}`
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        this.lessons = await response.json();
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.loading = false;
      }
    },

    clearSearch() {
      this.sendClientEvent(
        'click',
        'Search cleared',
        'Clear button'
      );

      this.searchText = '';
      this.loadLessons();
    },

    addToCart(lesson) {
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
      this.sendClientEvent(
        'change',
        'Teacher selection changed',
        'Teacher dropdown',
        { teacherId: this.selectedTeacherId || '(none)' }
      );

      this.teacherLessons = [];
      this.teacherError = '';

      if (!this.selectedTeacherId) {
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

        this.teacherLessons = await response.json();

        this.sendClientEvent(
          'success',
          'Teacher lessons loaded',
          'Teacher section',
          { lessonCount: this.teacherLessons.length }
        );
      } catch (error) {
        this.teacherError = error.message;
      } finally {
        this.teacherLoading = false;
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

      if (!this.canCheckout) return;

      this.submitting = true;
      this.errorMessage = '';
      this.confirmationMessage = '';

      try {
        const groups = {};

        this.cart.forEach(item => {
          if (!groups[item._id]) {
            groups[item._id] = {
              lesson: item,
              quantity: 0,
              originalSpace: Number(item.space)
            };
          }

          groups[item._id].quantity += 1;
          groups[item._id].originalSpace = Math.max(
            groups[item._id].originalSpace,
            Number(item.space)
          );
        });

        const order = {
          name: this.customerName,
          phone: this.customerPhone,
          lessonIDs: Object.keys(groups),
          numberOfSpaces: this.cart.length,
          items: Object.entries(groups).map(
            ([lessonId, group]) => ({
              lessonId,
              quantity: group.quantity
            })
          )
        };

        const orderResponse = await fetch(
          `${API_BASE_URL}/orders`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
          }
        );

        if (!orderResponse.ok) {
          throw new Error('Could not save the order');
        }

        const orderResult = await orderResponse.json();

        for (const [lessonId, group] of Object.entries(groups)) {
          const remainingSpace = Math.max(
            0,
            group.originalSpace - group.quantity
          );

          const updateResponse = await fetch(
            `${API_BASE_URL}/lessons/${lessonId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                space: remainingSpace
              })
            }
          );

          if (!updateResponse.ok) {
            throw new Error(
              'Order saved but lesson space update failed'
            );
          }

        }

        this.enrolmentLookupPhone = this.customerPhone;
        await this.loadMyEnrolments();

        this.confirmationMessage =
          'Order submitted successfully. Your lessons are now shown under My Enrolments.';

        this.sendClientEvent(
          'success',
          'Checkout completed',
          'Checkout',
          { purchasedSpaces: order.numberOfSpaces, lessonTypes: order.lessonIDs.length }
        );

        this.cart = [];
        this.customerName = '';
        this.customerPhone = '';

        await this.loadLessons();

        if (this.selectedTeacherId) {
          await this.loadTeacherLessons();
        }

        this.showCart = false;
        this.showEnrolments = true;
      } catch (error) {
        this.errorMessage = error.message;

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