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
      showCart: false,
      searchText: '',
      sortBy: 'topic',
      sortOrder: 'asc',
      selectedTeacherId: '',
      customerName: '',
      customerPhone: '',
      loading: false,
      submitting: false,
      teacherLoading: false,
      errorMessage: '',
      teacherError: '',
      confirmationMessage: ''
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
    imageUrl(name) {
      return `${API_BASE_URL}/images/${name}`;
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

    async searchLessons() {
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
      this.searchText = '';
      this.loadLessons();
    },

    addToCart(lesson) {
      if (lesson.space <= 0) return;

      this.cart.push({ ...lesson });
      lesson.space -= 1;
    },

    removeFromCart(index) {
      const removed = this.cart[index];
      const lesson = this.lessons.find(
        item => item._id === removed._id
      );

      if (lesson) {
        lesson.space += 1;
      }

      this.cart.splice(index, 1);

      if (!this.cart.length) {
        this.showCart = false;
      }
    },

    toggleCart() {
      if (this.cart.length) {
        this.showCart = !this.showCart;
      }
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
      } catch (error) {
        this.teacherError = error.message;
      } finally {
        this.teacherLoading = false;
      }
    },

    async loadEnrolment(id) {
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
      } catch (error) {
        this.errorMessage = error.message;
      }
    },

    async checkout() {
      if (!this.canCheckout) return;

      this.submitting = true;
      this.errorMessage = '';
      this.confirmationMessage = '';

      try {
        const counts = {};

        this.cart.forEach(item => {
          counts[item._id] = (counts[item._id] || 0) + 1;
        });

        const order = {
          name: this.customerName,
          phone: this.customerPhone,
          lessonIDs: Object.keys(counts),
          numberOfSpaces: this.cart.length,
          items: Object.entries(counts).map(
            ([lessonId, quantity]) => ({
              lessonId,
              quantity
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

        for (const lessonId of Object.keys(counts)) {
          const lesson = this.lessons.find(
            item => item._id === lessonId
          );

          const updateResponse = await fetch(
            `${API_BASE_URL}/lessons/${lessonId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                space: lesson.space
              })
            }
          );

          if (!updateResponse.ok) {
            throw new Error(
              'Order saved but lesson space update failed'
            );
          }
        }

        this.confirmationMessage =
          'Order submitted successfully. Your selected lesson spaces have been saved.';

        this.cart = [];
        this.customerName = '';
        this.customerPhone = '';

        await this.loadLessons();
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.submitting = false;
      }
    }
  },

  mounted() {
    this.loadLessons();
    this.loadTeachers();
  }
});

app.mount('#app');