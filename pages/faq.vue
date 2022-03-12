<template>
  <div>
    <Header :dark="scrollPosition < 640" />

    <div class="home-base">
      <div class="home-text-box center">
        <div class="home-welcome">
          <h1 class="title large">FAQ</h1>
          <h1 class="title small-title">
            If you haven't found answer on your question, feel free to
            <span class="pointer link" @click="redirect('/contact')">contact</span>.
          </h1>
        </div>
      </div>
    </div>

    <div class="home-content">
      <div class="home-content-box" v-for="q in questions" :key="q.title">
        <h3>{{ q.title }}</h3>
        <p class="paragraph-small medium">{{ q.answer }}</p>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script>
import { darkHeader } from "~/mixins/darkHeader";
export default {
  name: "faq",
  mixins: [ darkHeader ],
  data() {
    return {
      questions: [
        { title: 'Q: What the fuck is going on 1?', answer: 'I have no idea, m8' },
        { title: 'Q: What the fuck is going on 2?', answer: 'I have no idea, m8' },
        { title: 'Q: What the fuck is going on 3?', answer: 'I have no idea, m8' },
      ]
    }
  },
  methods: {
    redirect(path) {
      this.$router.push({ path })
    },
  }
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
