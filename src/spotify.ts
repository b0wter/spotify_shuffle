import { Album } from "./album";

const SpotifyWebApi = require('spotify-web-api-node');

export class Spotify
{
    private constructor(private api: any, private logger: any) {
        //
    }

    public urlIdentifier = 'spotify';
    public name = 'Spotify';
    public logo = 'spotify';

    public static async createFromCredentials(clientId: string, clientSecret: string, logger: any) {
        if(!clientId || !clientSecret)
        {
            throw new Error("Spotify client id and/or client secret are empty!");
        }
        
        const spotifyApi = new SpotifyWebApi({
            clientId: clientId,
            clientSecret: clientSecret
        })

        await spotifyApi.clientCredentialsGrant().then(
            function (data: any) {
                spotifyApi.setAccessToken(data.body['access_token']);
            },
            function (err: any) {
                logger.err('Something went wrong when retrieving an access token', err);
            }
        );
        return new Spotify(spotifyApi, logger);
    }

    private albumFromItem(item: any) : Album
    {
        return new Album(item.id, item.name, item.external_urls.spotify, item.images[0].url, item.images[1].url, item.images[2].url);
    }

    private isStandardAlbum(album: Album) : boolean
    {
        return !(album.name.includes("liest")
                || album.name.includes("Outro")
                || album.name.includes("Originalmusik")
                || album.name.includes("Original-Hörspiel zum")
                || album.name === "Das verfluchte Schloss" // Movie
                || album.name === "Das Geheimnis der Geisterinsel"); // Movie
    }

    public async getAllAlbums(artistId: string, showId: string) : Promise<Album[]>
    {
        const albumPromises = [];
        albumPromises.push(this.getArtistOrShowAlbums(artistId, "artist"));
        if (showId) {
            albumPromises.push(this.getArtistOrShowAlbums(showId, "show");
        }

        const albums = await Promise.all(albumPromises).then((arrays) => arrays.flat());
        return albums.filter(this.isStandardAlbum);
    }

    private async getArtistOrShowAlbums(spotifyId: string, contentType: string) : Promise<Album[]>
    {
        const batchSize = 50;
        let items : any[] = [];
        let offset = 0;
        let resultCount = 0;
        do
        {
            this.logger.info(`Retrieving next ${contentType} items with offset ${offset}.`);
            const result = await this.getBatch(offset, batchSize, spotifyId, contentType);
            resultCount = result.length;
            items = items.concat(result);
            offset += resultCount;
            this.logger.info(`Got ${resultCount} ${contentType} items.`)
        }
        while(resultCount === 50)
        return items.map(i => this.albumFromItem(i));
    }

    private async getBatch(offset: number, batchSize: number, spotifyId: string, contentType: string) : Promise<any>
    {
        let result;
        if (contentType === "artist") {
            result = await this.api.getArtistAlbums(spotifyId, { limit: batchSize, offset: offset });
        } else if (contentType === "show") {
            result = await this.api.getShowEpisodes(spotifyId, { limit: batchSize, offset: offset });
        } else {
            throw new Error("ContentType must be either 'artist' or 'show'!");
        }
        return result.body.items;
    }
}