About
=====
This web app randomly selects a "Die Drei ???" episode for you to listen to. The data is taken from Spotify and refreshed each time the application is started. A new album is picked each time the page is (re)loaded. Clicking on the album cover directly brings you to Spotify to start playing.

Spotify
=======
To run your own instance of this web app you will need to create a Spotify client id and secret on the [Spotify Developer dashboard](https://developer.spotify.com/dashboard/).

The app required you to set two environmen variables `DDF_SHUFFLE_SPOTIFY_CLIENT_ID` and `DDF_SHUFFLE_SPOTIFY_CLIENT_SECRET`. There is an optional variable `DDF_SHUFFLE_PORT` to change the port the app is listening on.

The app also supports `.env` files ([check the usage section](https://www.npmjs.com/package/dotenv)).

