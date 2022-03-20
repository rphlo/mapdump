const config = {
  onUpdate: (registration) => {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    registration.unregister().then(() => {
      console.log("SW updated");
      window.location.reload();
    });
  },
};

export default config;
