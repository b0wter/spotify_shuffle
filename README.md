About
=====
This web app randomly selects an album from a given artist to listen to. The data is taken from Spotify and refreshed each time the application is started. A new album is picked each time the page is (re)loaded. Clicking on the album cover directly brings you to Spotify to start playing. 

Configuration
=============
To run your own instance of this web app you will need to create a Spotify client id and secret on the [Spotify Developer dashboard](https://developer.spotify.com/dashboard/).
The app is configured by `.env` files ([check the usage section](https://www.npmjs.com/package/dotenv)) or via environment variables:
```
SPOTIFY_SHUFFLE_CLIENT_ID: 
SPOTIFY_SHUFFLE_CLIENT_SECRET: 
SPOTIFY_SHUFFLE_ARTIST_ID: 3meJIgRw7YleJrmbpbJK6S
```

Client Id & Client Secret
-------------------------
Go to the Spotify developer dashboard and create a new app. You will be given the id as well as the secret.

Artist Id
---------
You can easily find an artist id by going to spotify.com. Search for the artist and copy the id from the url (`3meJIgRw7YleJrmbpbJK6S` in this case):
```
https://open.spotify.com/artist/3meJIgRw7YleJrmbpbJK6S
```

Optional variables
------------------
There are two optional environment variables:
```
SPOTIFY_SHUFFLE_ARTIST_NAME: DDF
SPOTIFY_SHUFFLE_PORT: 8084
```

The **artist name*** is used in the page's title.
