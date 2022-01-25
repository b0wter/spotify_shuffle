import { Spotify } from "./spotify"
import express  from 'express';
import { Html } from "./html";
import { Album } from "./album";

require('dotenv').config();

const app = express();
const port = process.env.DDF_SHUFFLE_PORT ?? 8099;
const spotifyClientId = process.env.DDF_SHUFFLE_SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.DDF_SHUFFLE_SPOTIFY_CLIENT_SECRET;

const albums: Album[] = [];

function randomInt(min: number, max: number)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min;
}

async function main() {
    let spotify: Spotify | undefined = undefined;
    console.log("Creating Spotify client.")
    if(spotifyClientId && spotifyClientSecret && spotifyClientId.length > 0 && spotifyClientSecret.length > 0)
    {
        spotify = await Spotify.createFromCredentials(spotifyClientId, spotifyClientSecret);
        if(spotify === undefined || spotify === null)
            throw new Error("Could not initialize the spotify api client.");
    }
    else
    {
        throw new Error("Spotify client id or secret is not set. Please use the environment variables.");
    }
    console.log("Adding express configuration");
    app.use(express.static('public'));

    console.log("Adding routes");
    app.get('/', async (req, res) => {
        console.log("Incomig request for root page");
        if(spotify === undefined || spotify === null)
        {
            console.log("Spotify client is not set properly. Cannot handle request.");
            res.send("rekt :(");
        }
        else
        {
            const album = albums[randomInt(0, albums.length - 1)];
            console.log(album);
            res.send(Html.forResult(album));
        }
    });

    console.log('Retrieving albums from Spotify');
    const retrievedAlbums = await spotify?.getAllAlbums();
    if(retrievedAlbums)
    {
        for(const a of retrievedAlbums)
        {
            albums.push(a);
        }
    }
    else
    {
        throw new Error("Could not retrieve albums from Spotify.");
    }

    console.log("Adding listener");
    app.listen(port, () => {
        console.log(`Server is running at port ${port}.`)
    });

    console.log("All done, listening for request.");
}

// Running node locally does not require this but it is necessary to shut down properly in a container.
process.on('SIGINT', () => {
  console.info("Received exit signal")
  process.exit(0)
})

main();