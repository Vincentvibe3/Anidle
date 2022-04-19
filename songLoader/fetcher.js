import axios from "axios"
import { logger } from "./logging.js"
import { getSlug, getAnimeData } from "./animeThemes.moe.js"
import { loadSlugs, saveData, saveSlugs, shuffleData } from "./saving.js"
import { filterSongs } from "./filtering.js"
import { spotifyLinking } from "./linker.js"

const client_id = process.env.MAL_CLIENT

let animeCount = 16

export const getTop = async () => {
    let titles = []
    for (let page of [...Array(Math.ceil(animeCount / 100)).keys()]) {
        console.log(`Getting page ${page}`)
        await getTopPage(page, titles)
        console.log(`Done page ${page}`)
        await sleep(200)
    }
    return titles
}

const getTopPage = async (page, titles) => {
    await axios.get(`https://api.myanimelist.net/v2/anime/ranking?ranking_type=bypopularity&offset=${page * 100}&limit=100`,
        {
            headers: { "X-MAL-Client-ID": client_id }
        }
    ).then(
        ({ data }) => {
            for (let entry of data.data) {
                if (titles.length < animeCount) {
                    titles.push(entry.node.title)
                } else {
                    break
                }
            }
        }
    ).catch(
        (error)=>{
            logger.error(error, `Encountered error at getTopPage #${page}`)
            process.exit(1)
        }
    )
}

const getSlugs = async (titles) => {
    let slugs = []
    for (let title of titles){
        let slug = await getSlug(title)
        await sleep(1000)
        if (slug!==""){
            slugs.push(slug)
        }
    }
    return slugs
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const insertSlugData = (data, store) => {
    if (store.has(data.series)){
        let old = store.get(data.series)
        let newSet = old.concat(data.songs)
        store.set(data.series, newSet)
    } else {
        store.set(data.series, data.songs)
    }
}

const start = async (destination) => {
    let result = []
    let topAnimes = []
    let songs = new Map()
    let filteredSongs = new Map()
    let slugs = loadSlugs()
    console.log("Getting top anime")
    while (topAnimes.length==0){
        topAnimes = await getTop()
    }
    console.log("Getting slugs")
    while (slugs.length==0){
        slugs = await getSlugs(topAnimes)
    }
    saveSlugs(slugs)
    console.log(`Found ${slugs.length} slugs`)
    console.log("Getting Song Data")
    while (songs.size == 0){
        for (let slug of slugs){
            let songData = await getAnimeData(slug)
            if (songData!==null){
                insertSlugData(songData, songs)
            }
            await sleep(1000)
        }
    }
    console.log(`Found ${songs.size} slugs`)
    console.log("Filtering songs")
    while (filteredSongs.size == 0){
        for (const [anime, animeSongs] of songs.entries()){
            console.log(`Filtering ${anime}`)
            let filtered = await filterSongs(animeSongs)
            filteredSongs.set(anime, filtered)
        }
    }
    console.log("Formatting...")
    for (const [anime, animeSongs] of filteredSongs.entries()){
        for (let song of animeSongs){
            console.log(`Getting Spotify matches for ${song.name}`)
            let finalSong = await spotifyLinking(song)
            result.push({
                name:finalSong.name,
                anime:anime,
                id:finalSong.videoId,
                guessString:`${anime} - ${finalSong.name}`,
                altAnimes:finalSong.altAnime,
                external:finalSong.externalData,
                artist:finalSong.artist
            })
        }
    }
    console.log(`Filtered to ${result.length} results`)
    console.log("Shuffling Data")
    let shuffled = await shuffleData(result)
    console.log("Saving Data")
    await saveData(shuffled, destination)
}

let args = process.argv
start(args[2])