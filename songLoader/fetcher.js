import axios from "axios"
import { logger, runId } from "./logging.js"
import { getSlug, getAnimeData } from "./animeThemes.moe.js"
import { loadSlugs, saveData, saveSlugs, shuffleData } from "./saving.js"
import { filterSongs } from "./filtering.js"
import { spotifyLinking } from "./linker.js"
import * as wanakana from "wanakana"

console.log(runId)

const client_id = process.env.MAL_CLIENT

let animeCount = 150

export const getTop = async () => {
    let titles = []
    let mapping = new Map()
    for (let page of [...Array(Math.ceil(animeCount / 100)).keys()]) {
        console.log(`Getting page ${page}`)
        await getTopPage(page, titles, mapping)
        console.log(`Done page ${page}`)
        await sleep(200)
    }
    return {titles:titles, mapping:mapping}
}

const getTopPage = async (page, titles, mapping) => {
    await axios.get(`https://api.myanimelist.net/v2/anime/ranking?ranking_type=bypopularity&offset=${page * 100}&limit=100`,
        {
            headers: { "X-MAL-Client-ID": client_id }
        }
    ).then(
        ({ data }) => {
            for (let entry of data.data) {
                if (titles.length < animeCount) {
                    mapping.set(entry.node.title, entry.node.id)
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

const getJpTitle = (str) => {
    let reversed = str.split("").reverse()
    let jpTitleList = []
    let open = 0
    if (reversed[0] === ")") {
        for (let letter of reversed) {
            if (letter === ")") {
                open++
            } else if (letter === "(") {
                open--
            }
            if (open > 0) {
                jpTitleList.push(letter)
            } else {
                break
            }
        }
        jpTitleList.reverse().pop()

        let match = jpTitleList.join("")
        let checkStr = match
        let stripASCII = /[^a-z-A-Z-0-9]/
        let illegalCharacters = stripASCII.exec(wanakana.toRomaji(match))
        if (illegalCharacters != null) {
            for (let char of illegalCharacters) {
                if (!wanakana.isKanji(char)) {
                    checkStr = checkStr.replace(char, "")
                }
            }
        }
        if (wanakana.isMixed(checkStr) || wanakana.isJapanese(checkStr)) {
            return match
        } else {
            return ""
        }
    }
    return ""
}

const formatMalSong = (str) => {
    let cleanNumbers = /^#[0-9-a-z-A-z]*( |:)/gm
    let split = /(?<!^|[\s])[^\w]( by|By )/gm
    let endFilter = /^(\).*?\()/gm
    let filterBrackets = /\[.*\]/gm

    let cleaned = str.replace(cleanNumbers, "").replace("\n", "")
    let artistTrackSplit = cleaned.split(split)
    if (artistTrackSplit.length != 3) {
        return {
            track:"",
            artist:""
        }
    }
    let artistRound1 = artistTrackSplit[2]
        .split("").reverse().join("")
        .replace(endFilter, "").trim()
        .split("").reverse().join("")
        .replace(filterBrackets, "")
    let artistRound2 = endFilter.exec(artistRound1)
    let artist
    if (artistRound2 === null) {
        artist = artistRound1
    } else {
        artist = artistRound1.replace(artistRound2[1], "")
    }
    let track = artistTrackSplit[0].replace("\"", "")
    let jpName = getJpTitle(track)
    let enName = track.replace(`(${jpName})`, "").trim()
    return {
        track:enName,
        artist:artist
    }
}

const getMalSongData = async (id) => {
    let songs = []
    let response = await axios.get(`https://api.myanimelist.net/v2/anime/${id}?fields=opening_themes,ending_themes,media_type`,
        {
            headers: { "X-MAL-Client-ID": client_id }
        }
    )
    let data = response.data
    if (typeof data.opening_themes !== "undefined") {
        for (let op of data.opening_themes){
            songs.push(formatMalSong(op.text))
        }
    }
    if (typeof data.ending_themes !== "undefined") {
        for (let ed of data.ending_themes){
            songs.push(formatMalSong(ed.text))
        }
    }
    return songs
}

const getSlugs = async (titles, titleMapping, mapping) => {
    let slugs = []
    for (let title of titles){
        let slug = await getSlug(title)
        let malSongData = await getMalSongData(titleMapping.get(title))
        await sleep(1000)
        if (slug!==""){
            slugs.push(slug)
            mapping.set(slug, malSongData)
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
    let malMapping = new Map()
    let filteredSongs = new Map()
    let slugs = []//loadSlugs() disabled to allow fetching titles from mal until more save states are developed
    let slugSongMapping = new Map()
    console.log("Getting top anime")
    while (topAnimes.length==0){
        let data = await getTop()
        topAnimes = data.titles
        malMapping = data.mapping
    }
    console.log("Getting slugs")
    while (slugs.length==0){
        slugs = await getSlugs(topAnimes, malMapping, slugSongMapping)
    }
    // saveSlugs(slugs)
    console.log(`Found ${slugs.length} slugs`)
    console.log("Getting Song Data")
    while (songs.size == 0){
        for (let slug of slugs){
            let songData = await getAnimeData(slug, slugSongMapping)
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