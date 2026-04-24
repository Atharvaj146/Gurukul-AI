const url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDRtIJCbirmvBTPY3dITSao7cRVT2cv_Ys";
fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.log("API Error:", data.error.message);
    } else {
      console.log("Available models:");
      data.models.filter(m => m.name.includes("gemini")).forEach(m => console.log(m.name));
    }
  })
  .catch(err => console.error("Network Error:", err.message));
