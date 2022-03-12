export const darkHeader = {
  data() {
    return {
      scrollPosition: null
    }
  },
  mounted() {
    window.addEventListener('scroll', this.updateScroll)
  },
  methods: {
    updateScroll() { this.scrollPosition = window.scrollY }
  }
}
