import * as fs from "fs"
import axios from "axios"
import * as wanakana from "wanakana"
const client_id = process.env.MAL_CLIENT

var ids = []
var animeCount = 150
var songData = []
var animes = new Map()
var processed = 0
let cleanNumbers = /^#[0-9-a-z-A-z]*( |:)/gm
let split = /(?<!^|[\s])[^\w]( by|By )/gm
let endFilter = /^(\).*?\()/gm
let filterBrackets = /\[.*\]/gm

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

const formatSongs = (str) => {
    console.log(str)
    let cleaned = str.replace(cleanNumbers, "")
    let artistTrackSplit = cleaned.split(split)
    if (artistTrackSplit.length != 3) {
        return null
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
    console.log(track)
    let jpName = getJpTitle(track)
    let enName = track.replace(`(${jpName})`, "")
    return {
        enName: enName.trim(),
        jpName: jpName.trim(),
        artist: artist.trim()
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getSongs = async () => {
    console.log("Getting Songs")
    console.log(ids.length)
    for (let id of ids) {
        await getSong(id)
        processed++
        if (processed % 10 === 0) {
            console.log(`${processed}/${ids.length} animes processed`)
        }
        await sleep(1000)
    }
}

const getAnimes = async () => {
    console.log("Getting animes")
    for (let page of [...Array(Math.ceil(animeCount / 100)).keys()]) {
        console.log(`Getting page ${page}`)
        await getTop(page)
        console.log(`Done page ${page}`)
        await sleep(200)
    }
}

const checkDuplicates = (anime, data) => {
    if (animes.has(anime)) {
        let existing = animes.get(anime)
        if (existing.includes(data)) {
            return true
        } else {
            let stripPattern = /-.*-$/gm
            let stripPattern2 = /\(.*\)$/gm
            let verStripped = data.replace(stripPattern, "").replace(stripPattern2, "")
            for (let title of existing) {
                if (title.startsWith(data) || data.startsWith(title) || title.startsWith(verStripped)) {
                    return true
                }
            }
            existing.push(data)
            return false
        }
    } else {
        animes.set(anime, [data])
        return false
    }
}

const processSongs = (category, anime) => {
    for (let song of category) {
        console.log(song)
        let formatted = formatSongs(song.text)
        if (formatted != null) {
            formatted.anime = anime.replace("(TV)", "")
            let duplicate = checkDuplicates(formatted.anime, formatted.enName)
            if (!duplicate) {
                songData.push(formatted)
            }
        }
    }
}

const getSong = async (id) => {
    axios.get(`https://api.myanimelist.net/v2/anime/${id}?fields=opening_themes,ending_themes,media_type`,
        {
            headers: { "X-MAL-Client-ID": client_id }
        }
    ).then(
        ({ data }) => {
            let ignore = ["music", "special", "ova"]
            if (!ignore.includes(data.media_type.toLowerCase())) {
                if (typeof data.opening_themes !== "undefined") {
                    processSongs(data.opening_themes, data.title)
                }
                if (typeof data.ending_themes !== "undefined") {
                    processSongs(data.ending_themes, data.title)
                }
            }
        }
    ).catch(
        (error)=>{
            logger.error(error, `Encountered error at ${id}`)
            process.exit(1)
        }
    )
}

export const getTop = async (page) => {
    axios.get(`https://api.myanimelist.net/v2/anime/ranking?ranking_type=bypopularity&offset=${page * 100}&limit=100`,
        {
            headers: { "X-MAL-Client-ID": client_id }
        }
    ).then(
        ({ data }) => {
            for (let entry of data.data) {
                if (ids.length < animeCount) {
                    ids.push(entry.node.title)
                } else {
                    break
                }
            }
        }
    ).catch(
        (error)=>{
            process.exit(1)
        }
    )
}

const writeData = async () => {
    console.log("Writing data")
    if (ids.length > 0) {
        fs.writeFile("./data.json", JSON.stringify(songData),
            err => {
                if (err) {
                    console.error(err)
                    logger.error(err, "Failed to save file")
                    process.exit(1)
                }
                //file written successfully
            })
    }

}

const start = async () => {
    let args = process.argv
    if (args[2] == "--initial") {
        while (ids.length == 0) {
            await getAnimes()
            await getSongs()
            await writeData()
        }
    } else {
        //get seasonal anime
    }
}

start()

