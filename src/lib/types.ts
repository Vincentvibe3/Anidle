export interface Metadata{
    URL:string,
    artist:string,
    expiry:number, //Unix Timestamp
    albumArt:string
    source:string
}

export interface VideoInfo{
    link:string,
    expiry:number
}