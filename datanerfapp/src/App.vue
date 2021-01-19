<template>
  <mainPage/>
</template>

<script>
import mainPage from './components/mainPage.vue';

export default {
  name: 'App',
  components: {
    mainPage,
  },
};
</script>

<style lang="scss">
@import 'public/style/style.scss';
@import 'public//style/Chart.scss';
</style>
