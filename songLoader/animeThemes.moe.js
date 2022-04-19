import axios from "axios"
import * as stringSimilarity from "string-similarity"
import { logger } from "./logging.js";

let maxRetries = 5

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export const getAnimeData = async (slug) => {
    let data = {}
    let requestOk = false
    let response
    console.log(`Fetching slug ${slug}`)
    let tries = 0
    while (!requestOk){
        try{
            response = await axios.get(`https://staging.animethemes.moe/api/anime/${slug}?include=animethemes,animesynonyms,series,animethemes.animethemeentries.videos,animethemes.song,animethemes.song.artists&fields[song]=title&fields[video]=id,overlap,deleted_at&fields[animetheme]=deleted_at&fields[animethemeentry]=deleted_at,nsfw&fields[anime]=name,deleted_at,slug`, { timeout: 2000 })
            requestOk = true
        } catch {
            requestOk = false
            tries++
            if (tries===maxRetries){
                logger.error({}, `Failed to get data for ${slug}`)
                return null
            }
            console.log(`Retrying ${slug}`)
            await sleep(1000)
        }
    }
    let altSeriesNames = []
    if (response.data.anime.series.length !== 0){
        data.series = response.data.anime.series[0].name
        altSeriesNames.push(response.data.anime.name)
    } else {
        altSeriesNames.push(response.data.anime.name)
        let name = response.data.anime.name
        if (name.length>=30){
            let charCount = name.length
            for (let nameEntry of response.data.anime.animesynonyms){
                let synonym = nameEntry.text
                altSeriesNames.push(synonym)
                if (synonym.length<charCount){
                    charCount = synonym.length
                    name = synonym
                }
            }
        }
        data.series = name
    }
    console.log(`Series name set to ${data.series}`)
    let processedSongs = processSongData(response.data, data.series, altSeriesNames)
    data.songs = processedSongs
    return data
}

export const getSlug = async (name) => {
    console.log(`Matching ${name}`)
    let query = name.replace(" ", "+")
    let requestOk = false
    let response
    let url = encodeURI(`https://staging.animethemes.moe/api/anime/?q=${query}&include=series`)
    let tries = 0
    while (!requestOk){
        try {
            response = await axios.get(url, { timeout: 2000 })
            requestOk = true
        } catch(err) {
            console.log(err.message)
            requestOk = false
            tries++
            if (tries===maxRetries){
                logger.error({}, `Failed to get slug for ${name}`)
                return ""
            }
            console.log(`Retrying ${name}`)
            await sleep(1000)
        }
        
    }
    for (let item of response.data.anime){
        let match = checkAnimeMatch(item.name, name)
        if (match){
            console.log(`Slug Found: ${item.slug}`)
            return item.slug
        }
    }
    console.log(`No slug found for ${name}`)
    logger.error({}, `Failed to get slug for ${name}`)
    return ""
}

const checkAnimeMatch = (entryName, animeName) => {
    let sim = stringSimilarity.compareTwoStrings(entryName, animeName)
    return sim>=0.75;
}

const getVideos = (entries) => {
    let videos = []
    for (let version of entries){
        if (version.deleted_at === null&&version.nsfw===false){
            videos = videos.concat(version.videos)
        }
    }
    return videos
}

const getVideoId = (videos) => {
    for (let video of videos){
        if (video.overlap==="None"&&video.deleted_at===null){
            return video.id
        }
    }
    return null
}

const processSongData = (data, anime, synonyms) => {
    let songs = []
    let themes = data.anime.animethemes
    for (let entry of themes){
        let songName = entry.song.title
        let artists = []
        for (let artist of entry.song.artists){
            artists.push(artist.name)
        }
        let artistStr
        if (artists.length==0){
            artistStr = ""
        } else {
            artistStr = artists.join(", ")
        }
        let videos = getVideos(entry.animethemeentries)
        let id = getVideoId(videos)
        if (id!==null){
            songs.push({
                name:songName,
                videoId:id,
                anime:anime,
                altAnime:synonyms,
                artist:artistStr
            })
        }
    }
    return songs
}