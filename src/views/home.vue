<template>
  <div class="home">
        <AvatarAuto class="avatar-container" />
  </div>
</template>

<script>
import AvatarAuto from "./avatarAuto.vue"
export default {
  name: 'Home',
  components: { AvatarAuto },
}
</script>

<style scoped>
.home {
 height: 100%;
 width: 100%;
 background: url('@/assets/bg.jpg') no-repeat center center fixed;
 overflow: hidden;
}
.avatar-container {
  position: absolute;
  width: 600px;
  right: 0;
  top: 0;
  overflow: auto;
}
</style>
