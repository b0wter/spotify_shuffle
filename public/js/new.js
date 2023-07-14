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

window.onLoaded(onLoaded);

document
  .querySelectorAll(".chevron.left")
  .forEach((chevron) => chevron.addEventListener("click", onLastEpisodeClick));

// Play Button Click Event Handling
document
  .getElementById("play-button")
  .addEventListener("click", () => spotifyTransition.classList.add("active"));

function onLoaded() {
  const search = new URLSearchParams(window.location.search);
  let stack = sessionStorage.getItem("stack");

  if (stack == null) {
    const newStack = { episodes: [] };
    sessionStorage.setItem("stack", JSON.stringify(newStack));
    stack = newStack;
  } else stack = JSON.parse(stack);

  if (search.has("id")) {
    const id = search.get("id");
    const asInt = Number.parseInt(id);

    if (
      stack.episodes != null &&
      Number.isInteger(asInt) &&
      stack.episodes[stack.episodes.length - 1] !== id
    ) {
      stack.episodes.push(id);
      sessionStorage.setItem("stack", JSON.stringify(stack));
    }
  }

  // Enable the chevron if it can be used
  if (stack.episodes.length > 1) {
    document.querySelectorAll(".chevron.left").forEach((chevron) => {
      chevron.disabled = false;
    });
  }
}

function onTransitionEnd() {
  if (nextTransition.classList.contains("in")) {
    // Reload window
    window.location.reload();
  }
}

function onNextEpisodeClick() {
  // Load the transition IN animation
  nextTransition.classList.add("active");
  nextTransition.classList.replace("out", "in");
}

function onLastEpisodeClick() {
  let stack = JSON.parse(sessionStorage.getItem("stack"));

  if (stack?.episodes?.length > 1) {
    const lastEpisode = stack.episodes.pop();
    sessionStorage.setItem("stack", JSON.stringify(stack));
    window.location.href = "LOCATION HERE";
    // Reload the window with parameter /stack?episodeID=X
  }
}
