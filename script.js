const API_URL = "https://mental-helth-predictor-mansik-swasath.onrender.com"; // Update this URL if your FastAPI server is running on a different host or port

const form = document.getElementById("predictionForm");
const predictBtn = document.getElementById("predictBtn");
const errorMessage = document.getElementById("errorMessage");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const emptyState = document.getElementById("emptyState");
const resultState = document.getElementById("resultState");
const scoreValue = document.getElementById("scoreValue");
const scoreCircle = document.getElementById("scoreCircle");
const scoreBadge = document.getElementById("scoreBadge");
const scoreMessage = document.getElementById("scoreMessage");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");

const fields = [...form.querySelectorAll("input[required], select[required]")];

function updateProgress() {
  const completed = fields.filter(el => el.value.trim() !== "").length;
  const percent = Math.round((completed / fields.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${completed} / ${fields.length}`;
}

fields.forEach(field => field.addEventListener("input", updateProgress));
fields.forEach(field => field.addEventListener("change", updateProgress));

function getPayload() {
  const data = Object.fromEntries(new FormData(form).entries());

  return {
    Age: Number(data.Age),
    Gender: data.Gender,
    Country: data.Country,
    Academic_Level: data.Academic_Level,
    Most_Used_Platform: data.Most_Used_Platform,
    Purpose_Of_Use: data.Purpose_Of_Use,
    Avg_Daily_Usage_Hours: Number(data.Avg_Daily_Usage_Hours),
    Daily_Unlocks: Number(data.Daily_Unlocks),
    Study_Hours: Number(data.Study_Hours),
    Physical_Activity_Hours: Number(data.Physical_Activity_Hours),
    Sleep_Hours_Per_Night: Number(data.Sleep_Hours_Per_Night),
    Stress_Level: data.Stress_Level
  };
}

function validatePayload(payload) {
  if (payload.Age <= 10) return "Age must be greater than 10.";
  if (payload.Avg_Daily_Usage_Hours <= 0 || payload.Avg_Daily_Usage_Hours > 24) return "Daily usage must be between 0 and 24 hours.";
  if (payload.Daily_Unlocks <= 0) return "Daily unlocks must be greater than 0.";
  if (payload.Study_Hours <= 0 || payload.Study_Hours > 24) return "Study hours must be between 0 and 24.";
  if (payload.Physical_Activity_Hours <= 0 || payload.Physical_Activity_Hours > 24) return "Physical activity must be between 0 and 24 hours.";
  if (payload.Sleep_Hours_Per_Night <= 0 || payload.Sleep_Hours_Per_Night > 24) return "Sleep hours must be between 0 and 24.";
  return null;
}

function setLoading(state) {
  predictBtn.disabled = state;
  predictBtn.classList.toggle("loading", state);
}

function showError(message) {
  errorMessage.textContent = message;
}

function showResult(score) {
  emptyState.classList.add("hidden");
  resultState.classList.remove("hidden");

  const numericScore = Number(score);
  scoreValue.textContent = numericScore.toFixed(2);

  // 10 के स्केल के लिए विज़ुअल रिंग को अपडेट किया गया
  const visualScore = Math.max(0, Math.min(10, numericScore));
  const circumference = 2 * Math.PI * 92;
  scoreCircle.style.strokeDasharray = circumference;
  scoreCircle.style.strokeDashoffset = circumference;

  requestAnimationFrame(() => {
    scoreCircle.style.strokeDashoffset =
      circumference - (visualScore / 10) * circumference;
  });

  // 10 के स्केल के हिसाब से लॉजिक (उदा. 7.5 से ऊपर अच्छा है)
  if (numericScore >= 7.5) {
    scoreBadge.textContent = "Higher wellbeing signal";
    scoreBadge.style.color = "#52d9c7";
    scoreMessage.textContent = "The model produced a comparatively higher wellbeing score.";
  } else if (numericScore >= 5.0) {
    scoreBadge.textContent = "Moderate wellbeing signal";
    scoreBadge.style.color = "#c8b85d";
    scoreMessage.textContent = "The model produced a moderate wellbeing score.";
  } else {
    scoreBadge.textContent = "Lower wellbeing signal";
    scoreBadge.style.color = "#ff8a98";
    scoreMessage.textContent = "The model produced a comparatively lower wellbeing score.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const payload = getPayload();
  const validationError = validatePayload(payload);

  if (validationError) {
    showError(validationError);
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map(item => item.msg).join(", ")
        : (data.detail || "The API rejected the request.");
      throw new Error(detail);
    }

    if (typeof data.predicted_mental_health_score !== "number") {
      throw new Error("The API response did not contain predicted_mental_health_score.");
    }

    showResult(data.predicted_mental_health_score);
    document.getElementById("resultCard").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    console.error(error);
    showError(
      error.message.includes("Failed to fetch")
        ? "Cannot connect to the FastAPI server. Make sure it is running on port 2200."
        : error.message
    );
  } finally {
    setLoading(false);
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  updateProgress();
  emptyState.classList.remove("hidden");
  resultState.classList.add("hidden");
  errorMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

copyBtn.addEventListener("click", async () => {
  const text = `Predicted mental health score: ${scoreValue.textContent}`;
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy score"), 1500);
  } catch (_) {
    copyBtn.textContent = "Copy unavailable";
  }
});

updateProgress();
