// Transition Components
const nextTransition = document.getElementById("nextTransition");
const spotifyTransition = document.getElementById("spotifyTransition");

// Chevron Click Event Handling
document.getElementById("next-album-button").addEventListener("click", () => nextTransition.classList.add("active"));
document.getElementById("footer-next-album-button").addEventListener("click", () => nextTransition.classList.add("active"));

// Chevron Animation End Event Handling
nextTransition.addEventListener("animationend", () => nextTransition.classList.remove("active"));
spotifyTransition.addEventListener("animationend", () => {
    // Redirect to the Spotify URL
    document.location.href = "https://spotify.com";
} );

// Play Button Click Event Handling
document.getElementById("play-button").addEventListener("click", () => spotifyTransition.classList.add("active"));