import { getSong, type SongEntry } from '$lib/songChooser';
import type { Song, YoutubeInfo } from '$lib/songs';
import type { PageLoad } from './$types';
import type { Metadata } from "$lib/types"
import { loadVideo } from "$lib/getVideo"

const getVideo = async (id:number, url):Promise<string> => {
    console.log("Getting video")
    let response = await loadVideo(id)
    // if (response.status!=200){
    //     console.log("Failed to fetch video")
    //     return null
    // } else {
    //     return (await response.json()).video.link
    // }
    return response.video.link
}

const getMetadata = async (song:Song, url):Promise<Metadata> => {
    let metadata:Metadata
    for (let externalSource of song.external){
        if (externalSource.source=="youtube"){
            let source = externalSource as YoutubeInfo
            metadata = {
                URL:`https://www.youtube.com/watch?v=${source.id}`,
                albumArt:source.thumbnail,
                artist:song.artist,
                expiry:Date.now()+86400000,
                source:"youtube"
            }
        } else if (externalSource.source=="spotify"){
            let response = await fetch(`${url.origin}/getMetadata?id=${externalSource.id}`)
            if (response.status!=200){
                return null
            }
            metadata =  (await response.json()).metadata
        }
    }
    return metadata
}

export const load = (async ({url}) => {
    // if (browser) {
        console.log("Loading")
        let songEntry:SongEntry = getSong()
        let song = songEntry.song
        let link = await getVideo(song.id, url)
        let metadata = await getMetadata(song, url)
        if (metadata==null||link==null){
            return {
                props: {
                    song:song,
                    metadata:{
                        URL:"",
                        artist:"",
                        expiry:-1, //Unix Timestamp
                        albumArt:"",
                        source:""
                    },
                    link:"",
                    loadFailed:true,
                    loaded:true,
                    index:songEntry.song.index,
                    nextTime:songEntry.expiry
                }
            }
        }
        return {
            props: {
                song:song,
                metadata: metadata,
                loadFailed:false,
                link:link,
                loaded: true,
                index:songEntry.song.index,
                nextTime:songEntry.expiry
            }
        }
    // }
    // return {
    //     status: 200,
    // }
}) satisfies PageLoad;