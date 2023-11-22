<template>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'SensorDataRelay',

  data () {
    return {
      socket: false
    }
  },

  async mounted () {
    await new Promise((resolve) => {
      this.socket = this.$nuxtSocket({
        name: 'local',
        withCredentials: true
      })
      this.socket.on('disconnect', async () => {
        await this.$delay(500)
        socket.connect()
      })
      this.socket.on('connect', () => {
        resolve()
      })
    })
    console.log(this.socket)
    this.socket.on('module|localhost-sensor-data|payload', (data) => {
      console.log('hit', data)
    })
  }
}
</script>