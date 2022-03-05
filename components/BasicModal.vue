<template>
  <div>
    <button @click="showModal = true">Show Modal</button>
    <transition name="fade" appear>
      <div class="modal-overlay" v-if="showModal" @click="showModal = false"></div>
    </transition>
    <transition name="slide" appear>
      <div class="modal" v-if="showModal">
        <h1>Lorem Ipsum</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Atque fuga, neque odio perferendis quas soluta temporibus? Adipisci laboriosam necessitatibus odio.</p>
        <button class="close-modal" @click="showModal = false">Close</button>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "BasicModal",
  data() {
    return {
      showModal: false
    }
  },
}
</script>

<style lang="scss">
@import "../assets/css/components/BasicModal";
</style>
