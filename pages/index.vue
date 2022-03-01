<template>
  <div>
    <Loader />
    <Waves />
    <div class="home">
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta maxime sed temporibus. Cum cumque est ex id ipsam libero, qui quia sunt ut voluptatum? A, aliquam delectus eius est hic id incidunt inventore iusto magni maxime minima necessitatibus nesciunt officiis perferendis, quam quidem, quis quisquam quo rem sapiente vitae voluptatem.
    </div>
  </div>
</template>

<script>
import Waves from "@/components/Waves";
import Loader from "@/components/Loader";
export default {
  name: 'IndexPage',
  components: {
    Waves,
    Loader
  }
}
</script>

<style lang="scss">
@import "../assets/css/home";
</style>
