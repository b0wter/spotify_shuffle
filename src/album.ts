export class Album {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly url: string,
        public readonly image640Url: string,
        public readonly image300Url: string,
        public readonly image64Url: string
    )
    {}
}