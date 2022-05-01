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

    private async getBatch(offset: number, batchSize: number, artistId: string) : Promise<any>
    {
        const result = await this.api.getArtistAlbums(artistId, { limit: batchSize, offset: offset });
        return result.body.items;
    }

    private isStandardAlbum(album: Album) : boolean
    {
        return !(album.name.includes("liest")
                || album.name.includes("Outro")
                || album.name.includes("Originalmusik"))
    }

    public async getAllAlbums(artistId: string) : Promise<Album[]>
    {
        const batchSize = 50;
        let items : any[] = [];
        let offset = 0;
        let resultCount = 0;
        do
        {
            this.logger.info(`Retrieving next items with offset ${offset}.`);
            const result = await this.getBatch(offset, batchSize, artistId);
            resultCount = result.length;
            items = items.concat(result);
            offset += resultCount;
            this.logger.info(`Got ${resultCount} items.`)
        }
        while(resultCount === 50)
        const albums = items.map(i => this.albumFromItem(i));
        return albums.filter(this.isStandardAlbum);
    }
}