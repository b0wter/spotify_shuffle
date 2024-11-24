import { Spotify } from "./spotify"
import express, { Request, Response } from 'express';
import { Album } from "./album";

require('dotenv').config();

const app = express();
const port = process.env.SPOTIFY_SHUFFLE_PORT ?? 8099;
const spotifyClientId = process.env.SPOTIFY_SHUFFLE_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_SHUFFLE_CLIENT_SECRET;
const spotifyArtistId = process.env.SPOTIFY_SHUFFLE_ARTIST_ID;
const spotifyShowId = process.env.SPOTIFY_SHUFFLE_SHOW_ID;
const artistName = process.env.SPOTIFY_SHUFFLE_ARTIST_NAME ?? "Spotify";
const logMeta = process.env.SPOTIFY_SHUFFLE_LOG_META ?? false;
const logMaxSize = process.env.SPOTIFY_SHUFFLE_MAX_LOG_SIZE ?? 10000000;
const cookieParser = require('cookie-parser');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.File({
            filename: 'app.log',
            maxSize: logMaxSize,
            format: winston.format.json()
        }),
        new winston.transports.Console({
            format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple())
        })
    ]
});

const metaLoggerTransports = [
    new winston.transports.File({
        filename: 'meta.log',
        maxSize: logMaxSize,
        format: winston.format.json()
    })
];

const metaLogger =
    winston.createLogger({
        level: 'info',
        transports: logMeta ? metaLoggerTransports : []
    });

const albums: Album[] = [];

function randomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNowAsString(): string {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2).toString();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2).toString();
    let year = date_ob.getFullYear().toString();
    let hours = date_ob.getHours().toString().padStart(2, '0');
    let minutes = date_ob.getMinutes().toString().padStart(2, '0');
    let seconds = date_ob.getSeconds().toString().padStart(2, '0');
    return (year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
}

function getIgnoredEpisodesFromRequest(req: Request): string[] {
    const ignoredEpisodes: string[] = [];
    if (req.cookies && req.cookies.ignoredEpisodes) {
        const rawIgnoredEpisodes = req.cookies.ignoredEpisodes.split(";");
        for (const r of rawIgnoredEpisodes)
            ignoredEpisodes.push(r);
    }

    const fromQuery = getIgnoreEpisodeFromQuery(req);
    if(fromQuery) {
        ignoredEpisodes.push(fromQuery[0]);
    }

    return ignoredEpisodes;
}

function getIgnoreEpisodeFromQuery(req: Request) : [string, string] | undefined {
    if (req.query.ignore) {
        const i = req.query.ignore;
        const n = req.query.name;
        if (typeof (i) === "string" && typeof(n) === "string") {
            if (albums.some(a => a.id === i)) {
                return [i, n];
            }
            else {
                logger.warn(`Got ignore request for an unknown id '${i}'.`);
            }
        }
        else if(typeof(i) === 'string')
        {
            if (albums.some(a => a.id === i)) {
                return [i, "unknown"]
            }
            else {
                logger.warn(`Got ignore request for an unknown id '${i}'.`);
            }
        }
        else {
            logger.warn(`Unknown query parameter value for 'ignored': ${req.query.ignore}`);
        }
    }
    return undefined;
}

function getUndoFromQuery(req: Request) : string | undefined {
    if (req.query.undo && typeof(req.query.undo) === "string") {
        return req.query.undo;
    }
    return undefined;
}

function getThemeFromQuery(req: Request) : string {
    if (req.query.newTheme) {
        return "index_new"
    } else {
        return "index"
    }
}

function setIgnoredEpisodes(res: Response, ignoredEpisodes: string[]) {
    const unique = [...new Set(ignoredEpisodes)];
    const merged = unique.join(';');
    const trimmed = merged.substring(0, 4096);
    res.cookie("ignoredEpisodes", trimmed);
}

function uptimeAsFormattedString() {
    const uptime: number = process.uptime();
    function pad(s: number) {
        return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(uptime / (60 * 60));
    var minutes = Math.floor(uptime % (60 * 60) / 60);
    var seconds = Math.floor(uptime % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
}

async function main() {
    let spotify: Spotify | undefined = undefined;
    logger.info("Creating Spotify client.")
    if (spotifyClientId && spotifyClientSecret && spotifyClientId.length > 0 && spotifyClientSecret.length > 0) {
        spotify = await Spotify.createFromCredentials(spotifyClientId, spotifyClientSecret, logger);
        if (spotify === undefined || spotify === null)
            throw new Error("Could not initialize the spotify api client.");
    }
    else {
        throw new Error("Spotify client id or secret is not set. Please set SPOTIFY_SHUFFLE_CLIENT_ID and SPOTIFY_SHUFFLE_CLIENT_SECRET.");
    }
    logger.info("Adding express configuration");
    app.use(express.static('public'));
    app.use(cookieParser());
    app.set('view engine', 'pug');

    logger.info("Adding routes");
    app.get('/', async (req, res) => {
        logger.info(`${getNowAsString()} - Incomig request for root page`);
        const undoFromQuery = getUndoFromQuery(req);
        let ignoredEpisodes = getIgnoredEpisodesFromRequest(req);
        ignoredEpisodes = ignoredEpisodes.filter(x => x !== undoFromQuery);
        const ignoreFromQuery = getIgnoreEpisodeFromQuery(req);
        setIgnoredEpisodes(res, ignoredEpisodes);
        const nonIgnoredAlbums = albums.filter(a => !ignoredEpisodes.some((i: string) => a.id === i));
        const album = nonIgnoredAlbums[randomInt(0, nonIgnoredAlbums.length - 1)];
        metaLogger.info({ timestamp: new Date(), albumId: album.id, albumName: album.name });
        const theme = getThemeFromQuery(req);
        logger.info(`Using theme ${theme}`);
        res.render(theme,
            {
                artistName: artistName,
                albumUrl: album.url,
                albumImage64Url: album.image64Url,
                albumImage300Url: album.image300Url,
                albumImage640Url: album.image640Url,
                albumId: album.id,
                albumName: album.name,
                previousAlbumId: ignoreFromQuery ? ignoreFromQuery[0] : undefined,
                previousAlbumName: ignoreFromQuery ? ignoreFromQuery[1] : undefined,
                blacklistLength: ignoredEpisodes.length
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
        } catch (e: any) {
            if (typeof (e) === "string") {
                healthCheck.message = e;
            } else if (e instanceof Error) {
                healthCheck.message = e.message;
            } else {
                healthCheck.message = "Unknown error";
            }
            res.status(503).send();
        }
    });

    if (spotifyArtistId === undefined || spotifyArtistId === null) {
        throw new Error("The artist id has not been set. Please set SPOTIFY_SHUFFLE_ARTIST_ID.")
    }

    logger.info('Retrieving albums from Spotify');
    const retrievedAlbums = await spotify?.getAllAlbums(spotifyArtistId ?? "", spotifyShowId ?? "");
    if (retrievedAlbums) {
        logger.info("Total albums: " + retrievedAlbums.length);
        for (const a of retrievedAlbums) {
            albums.push(a);
        }
    }
    else {
        throw new Error("Could not retrieve albums from Spotify.");
    }

    logger.info("Adding listener");
    app.listen(port, () => {
        logger.info(`Server is running at port ${port}.`)
    });

    logger.info("All done, listening for request.");
}

// Running node locally does not require this but it is necessary to shut down properly in a container.
process.on('SIGINT', () => {
    logger.info("Received exit signal")
    process.exit(0)
})

main();
