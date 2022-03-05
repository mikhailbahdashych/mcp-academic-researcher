<template>
  <div class="settings-modal-container">
    <div class="settings-modal-wrapper">
      <div class="modal-header">
        <button style="margin-left: 500px" @click="$emit('close')">Close</button>
        <h3>{{header}}</h3>
      </div>
      <p class="modal-description">{{description}}</p>
      <slot/>
    </div>
  </div>
</template>

<script>
export default {
  name: "BasicModal",
  props: {
  header: String,
    description: String,
    onClose: Boolean
},
}
</script>

<style lang="scss">
@import "../assets/css/components/BasicModal";
</style>
