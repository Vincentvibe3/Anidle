import * as stringSimilarity from "string-similarity"
import { logger } from "./logging.js"
import axios from "axios"
import * as wanakana from "wanakana"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
const kuroshiro = new Kuroshiro.default();

const client_id = process.env.SPOTIFY_CLIENT
const client_secret = process.env.SPOTIFY_SECRET

let alphaNumeric = /[a-z-A-Z]/
let maxRetries = 3

const setup = async () => {
    await kuroshiro.init(new KuromojiAnalyzer())
}

setup()

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const getToken = async () => {
    let auth = Buffer.from(`${client_id}:${client_secret}`).toString("base64")
    let response = await axios.post("https://accounts.spotify.com/api/token", "grant_type=client_credentials",
        {
            method:"POST",
            headers:{
                "Authorization":`Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    )
    return response.data.access_token
}

let token = ""

const queryBuilder = (songName, artist) => {
    let queries = []
    let jpConvert = wanakana.toKatakana(songName,  { customKanaMapping: { lu: 'ル', la: 'ラ', li:"り", le:"レ", lo:"ロ" }})
    let validConvert = true
    if (alphaNumeric.test(jpConvert)){
        validConvert = false
    }
    if (validConvert){
        queries.push(jpConvert)
        if (artist!=""){
            queries.push(`${jpConvert} ${artist}`)
        }
    }
    if (songName.includes("ou")){
        queries.push(songName.replace("ou", "o"))
        if (artist!=""){
            queries.push(`${songName.replace("ou", "o")} ${artist}`)
        }
    }
    if (artist!=""){
        queries.push(`${songName} ${artist}`)
    }
    queries.push(songName)
    return queries
}

export const spotifyLinking = async (song) => {
    if (token===""){
        token = await getToken()
    }
    let name = song.name
    let markets = ["JP", "US"]
    let queries = queryBuilder(name, song.artist)
    let scores = new Map()
    for (let market of markets){
        for (let query of queries){
            await scoreMatches(song, query, market, scores)
            await sleep(100)
        }
    }
    let sortedScores = Array.from(scores.keys()).sort(
        function compareNumbers(a, b) {
            return a - b;
            }              
    ).reverse()
    let top = sortedScores[0]
    let matches = scores.get(top)
    if (scores.size!==0){
        let match = matches[0]
        if (top>0.72){
            song.externalData.push(
                {
                    source:"spotify",
                    id:match.id,
                }
            )
        } else {
            logger.warn(`Spotify match for ${song.name} failed`)
        }
        if (song.artist===""){
            song.artist = match.artist
        }
    } else {
        logger.warn(`Spotify match for ${song.name} failed`)
        if (song.artist===""){
            song.artist = "Unknown Artist"
        }
    }
    return song
}

const insertScoreData = (count, data, store) => {
    if (store.has(count)){
        store.get(count).push(data)
    } else {
        store.set(count, [data])
    }
}

const replaceModHepburn = (str) => {
    const aHepburn = "ā"
    const eHepburn = "ē"
    const iHepburn = "ī"
    const uHepburn = "ū"
    const oHepburn = "ō"
    return str.replace(aHepburn, "aa")
      .replace(eHepburn, "ee")
      .replace(iHepburn, "ii")
      .replace(uHepburn, "uu")
      .replace(oHepburn, "oo")
  }

const scoreMatches = async (song, query, market, store) => {
    let url = encodeURI(`https://api.spotify.com/v1/search?q=${query}&market=${market}&type=track`)
    let tries = 0
    let requestOk = false
    let response
    let isArtistQuery = false
    if (song.artist!=""){
        isArtistQuery = query.includes(song.artist)
    }
    while (!requestOk){
        try{
            response = await axios.get(url,{ 
                    headers:{
                        "Authorization":`Bearer ${token}`,
                        "Accept":"application/json",
                        "Content-Type": "application/json"
                    }
                }
            )
            requestOk = true
        } catch {
            requestOk = false
            tries++
            if (tries===maxRetries){
                logger.error({}, `Failed to get data for ${song.name}`)
                return null
            }
            console.log(`Retrying ${song.name}`)
            await sleep(100)
        }
    }
    let items = response.data.tracks.items
    for (let item of items){
        let id = item.id
        let name = item.name
        let artists = []
        let popularity = item.popularity/100
        for (let artist of item.artists){
            artists.push(artist.name)
        }
        let artistStr = artists.join(", ")
        let spStr
        if (song.artist==""){
            spStr = `${name}`
        } else {
            spStr = `${name} ${artistStr}`
        }
        let stripJp = await kuroshiro.convert(spStr, { to: "romaji" })
        let fixedRom = replaceModHepburn(stripJp).toLowerCase()
        let sim = stringSimilarity.compareTwoStrings(fixedRom, `${song.name} ${song.artist}`.toLowerCase())
        let score
        if (items.length == 1&&isArtistQuery){
            score = sim*0.85+popularity*0.15
        } else if (isArtistQuery) {
            score = sim*0.4+popularity*0.6
        } else {
            score = sim*0.3+popularity*0.7
        }
        insertScoreData(score, {name:name, artist:artistStr, id:id}, store)
    }
}