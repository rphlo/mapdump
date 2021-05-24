const config = {
  onUpdate: registration => {
    registration.unregister().then(() => {
      console.log('SW updated')
      window.location.reload()
    })
  },
};

export default config;