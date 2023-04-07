import { getSong, type SongEntry } from '$lib/songChooser';
import type { Song, YoutubeInfo } from '$lib/songs';
import type { PageLoad } from './$types';
import type { Metadata } from '../../old/getMetadata';

const getVideo = async (id:number, url):Promise<string> => {
    let response = await fetch(`${url.origin}/getVideo?id=${id}`)
    if (response.status!=200){
        return null
    } else {
        return (await response.json()).video.link
    }
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
                    metadata:{},
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