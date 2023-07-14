// Transition Components
const nextTransition = document.getElementById("nextTransition");
const spotifyTransition = document.getElementById("spotifyTransition");

// Chevron Click Event Handling
document
  .getElementById("next-album-button")
  .addEventListener("click", onNextEpisodeClick);
document
  .getElementById("footer-next-album-button")
  .addEventListener("click", () => nextTransition.classList.add("active"));

// Chevron Animation End Event Handling
nextTransition.addEventListener("animationend", onTransitionEnd);
spotifyTransition.addEventListener("animationend", () => {
  // Redirect to the Spotify URL
  document.location.href = "https://spotify.com";
  spotifyTransition.classList.remove("active");
});

// Play Button Click Event Handling
document
  .getElementById("play-button")
  .addEventListener("click", () => spotifyTransition.classList.add("active"));

function onLoaded() {
  // Load the transition OUT animation
  // If the stack has reached a limit, reset the stack
}

function onTransitionEnd() {
  if (nextTransition.classList.contains("in")) {
    // Reload window
    window.location.reload();
  }
}

function onNextEpisodeClick() {
  // Add the current episode to the stack
  // Save stack in browser local storage

  // Load the transition IN animation
  nextTransition.classList.add("active");
  nextTransition.classList.replace("out", "in");
}

function onLastEpisodeClick() {
  // Pop the last episode and save its id as X
  // Save stack in browser local storage
  // Play reversed animation
  // Reload the window with parameter /stack?episodeID=X
}
