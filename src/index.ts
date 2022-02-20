import { Spotify } from "./spotify"
import express, { Request, Response }  from 'express';
import { Album } from "./album";

require('dotenv').config();

const app = express();
const port = process.env.SPOTIFY_SHUFFLE_PORT ?? 8099;
const spotifyClientId = process.env.SPOTIFY_SHUFFLE_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_SHUFFLE_CLIENT_SECRET;
const spotifyArtistId = process.env.SPOTIFY_SHUFFLE_ARTIST_ID;
const artistName = process.env.SPOTIFY_SHUFFLE_ARTIST_NAME ?? "Spotify";
const cookieParser = require('cookie-parser');

const albums: Album[] = [];

function randomInt(min: number, max: number)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min;
}

function getNowAsString() : string
{
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2).toString();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2).toString();
    let year = date_ob.getFullYear().toString();
    let hours = date_ob.getHours().toString().padStart(2, '0');
    let minutes = date_ob.getMinutes().toString().padStart(2, '0');
    let seconds = date_ob.getSeconds().toString().padStart(2, '0');
    return(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
}

function getIgnoredEpisodesFromRequest(req: Request) : string[] {
    const ignoredEpisodes : string[] = [];
    if(req.cookies && req.cookies.ignoredEpisodes)
    {
        const rawIgnoredEpisodes = req.cookies.ignoredEpisodes.split(";");
        for(const r of rawIgnoredEpisodes)
            ignoredEpisodes.push(r);
    }

    if(req.query.ignore)
    {
        const i = req.query.ignore;
        if(typeof(i) === "string")
        {
            if(albums.some(a => a.id === i))
            {
                ignoredEpisodes.push(i);
            }
            else
            {
                console.log(`Got ignore request for an unknown id '${i}'.`);
            }
        }
        else
        {
            console.log(`Unknown query parameter value for 'ignored': ${req.query.ignore}`);
        }
    }

    return ignoredEpisodes;
}

function setIgnoredEpisodes(res: Response, ignoredEpisodes: string[]) {
    const unique = [...new Set(ignoredEpisodes)];
    const merged = unique.join(';');
    const trimmed = merged.substring(0, 4096);
    res.cookie("ignoredEpisodes", trimmed);
}

function uptimeAsFormattedString(){
  const uptime : number = process.uptime();
  function pad(s: number){
    return (s < 10 ? '0' : '') + s;
  }
  var hours = Math.floor(uptime / (60*60));
  var minutes = Math.floor(uptime % (60*60) / 60);
  var seconds = Math.floor(uptime % 60);

  return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
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
        throw new Error("Spotify client id or secret is not set. Please set SPOTIFY_SHUFFLE_CLIENT_ID and SPOTIFY_SHUFFLE_CLIENT_SECRET.");
    }
    console.log("Adding express configuration");
    app.use(express.static('public'));
    app.use(cookieParser());
    app.set('view engine', 'pug');

    console.log("Adding routes");
    app.get('/', async (req, res) => {
        console.log(`${getNowAsString()} - Incomig request for root page`);
        const ignoredEpisodes = getIgnoredEpisodesFromRequest(req);
        setIgnoredEpisodes(res, ignoredEpisodes);
        const nonIgnoredAlbums = albums.filter(a => !ignoredEpisodes.some((i: string) => a.id === i));
        const album = nonIgnoredAlbums[randomInt(0, nonIgnoredAlbums.length - 1)];
        res.render('index', 
            { 
                artistName: artistName, 
                albumUrl: album.url,
                albumImage64Url: album.image64Url,
                albumImage300Url: album.image300Url,
                albumImage640Url: album.image640Url,
                albumId: album.id
            });
    });

    app.get('/health', async (req, res) => {
        const healthCheck = {
            uptime: uptimeAsFormattedString(),
            message: 'OK',
            albumCount: albums.length,
            timestamp: getNowAsString()
        };
        try {
            res.send(healthCheck);
        } catch(e: any) {
            if (typeof(e) === "string") {
                healthCheck.message = e;
            } else if (e instanceof Error) {
                healthCheck.message = e.message;
            } else {
                healthCheck.message = "Unknown error";
            }
            res.status(503).send();
        }
    });

    if(spotifyArtistId === undefined || spotifyArtistId === null)
    {
        throw new Error("The artist id has not bben set. Please set SPOTIFY_SHUFFLE_ARTIST_ID.")
    }

    console.log('Retrieving albums from Spotify');
    const retrievedAlbums = await spotify?.getAllAlbums(spotifyArtistId);
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