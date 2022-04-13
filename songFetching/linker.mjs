import * as fs from "fs"
import axios from "axios"
import * as wanakana from "wanakana"
import { logger, runId } from "./logging.mjs"
import * as stringSimilarity from "string-similarity"

const client_id = process.env.SPOTIFY_CLIENT
const client_secret = process.env.SPOTIFY_SECRET

let datastr = fs.readFileSync("data.json")
let dataJson = JSON.parse(datastr)

import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
const kuroshiro = new Kuroshiro.default();

let punctuation = /[.,\"\/#!$%\^&\*;:{}=\-'_`~()?]/g

let matches = []
let failures = []
let review = new Map()

console.log(`RunId: ${runId}`)
let reviewLogger = logger.child({type:"review"})
let failureLogger = logger.child({type:"failure"})

const getJpTitle = (str) => {
    let reversed = str.split("").reverse()
    let jpTitleList = []
    let open = 0
    if (reversed[0]===")"){
      for (let letter of reversed){
        if (letter===")"){
          open++
        } else if (letter==="("){
          open--
        } 
        if (open>0){
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
      if (illegalCharacters!=null){
        for (let char of illegalCharacters){
          if (!wanakana.isKanji(char)){
            checkStr = checkStr.replace(char, "")
          }
        }
      }
      if (wanakana.isMixed(checkStr) || wanakana.isJapanese(checkStr)){
        return match
      } else {
        return ""
      } 
    }
    return ""
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

const addFail = (str)=> {
  const index = failures.indexOf(str);
  if (index == -1) {
    failures.push(str)
  }
}

const removeFail = (str) => {
  const index = failures.indexOf(str);
  if (index > -1) {
    failures.splice(index, 1);
  }
}

const addReview = (str, info)=> {
  if (review.has(str)){
    review.get(str).push(info)
  } else {
    review.set(str, [info])
  }
}

const removeReview = (str) => {
  if (review.has(str)){
    review.delete(str)
  }
}

const getMatches = async (accessToken, query, info, artists, market)=>{
    let url = encodeURI(`https://api.spotify.com/v1/search?q=${query}&market=${market}&type=track`)
    let response = await axios.get(url,{ 
            headers:{
                "Authorization":`Bearer ${await accessToken}`,
                "Accept":"application/json",
                "Content-Type": "application/json"
            }
        }
    )
    let data = response.data
    let tempReview = []
    for (let item of data.tracks.items){
      let spArtists = []
      if (item===null){
        continue
      }
      for (let artist of item.artists){
            spArtists.push(artist.name)
      } 
      let artistCheck = await checkArtist(spArtists, artists.en, artists.jp)
      let titleCheck = await checkTitle(item.name, info.enName, info.jpName)
      if (titleCheck&&artistCheck){
          console.log(`Found ${info.enName}`)
          removeFail(`${info.anime} - ${info.enName}`)
          removeReview(`${info.anime} - ${info.enName}`)
          matches.push({
            id:item.id,
            name:`${info.anime} - ${info.enName}`
          })
          return true
        } else if (artistCheck||titleCheck) {
          tempReview.push(
            {
              id:item.id,
              url:item.external_urls.spotify
            }
          )
      }
    }
    if (tempReview.length!=0){
      removeFail(`${info.anime} - ${info.enName}`)
      addReview(`${info.anime} - ${info.enName}`, tempReview)
    } else {
      if (!review.has(`${info.anime} - ${info.enName}`)){
        addFail(`${info.anime} - ${info.enName}`)
      }
    }
    return false
}

const getArtists = (artists) => {
    let matcher = /,|feat.|ft.|and/
    let listPrelim = artists.split(matcher)
    let jpArtists = []
    let enArtists = []
    let same = true
    for (let item of listPrelim){
        let jp = getJpTitle(item).toLowerCase()
        let en = item.replace(`(${jp})`, "").toLowerCase()
        if (jp==""){
            jp = en
        } else {
          same = false
        }
        jpArtists.push(jp)
        enArtists.push(en)
    }
    return {
        en:enArtists,
        jp:jpArtists,
        same:same
    }
}

const format = async (str) => {
  let stripJp = await kuroshiro.convert(str, { to: "romaji" })
  let fixedRom = replaceModHepburn(stripJp)
  return fixedRom.toLowerCase()
    .replace(punctuation, "")
    .replace(" ", "")
}

const checkArtist = async (spotifyArtists, artists, jpArtists) => {
    for (let spArtist of spotifyArtists){
        if (jpArtists.includes(spotifyArtists)){
          return true
        }
        for (let artist of artists){
          let formatted = await format(artist)
          let spFormatted = await format(spArtist)
          let sim = stringSimilarity.compareTwoStrings(formatted, spFormatted)
          if (sim>=0.75){
            return true
          }
        }
    }
    return false
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

const checkTitle = async (spTitle, title, jpTitle) => {
  if (jpTitle==""){
    jpTitle = wanakana.toKatakana(title, { customKanaMapping: { lu: 'ル', la: 'ラ', li:"り", le:"レ", lo:"ロ" }})
  }
  let formatted = await format(title)
  let jpFormatted = await format(jpTitle)
  let spFormatted = await format(spTitle)
  let sim = stringSimilarity.compareTwoStrings(formatted, spFormatted)
  return (jpFormatted===spFormatted||sim>=0.75)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const writeData = async () => {
  console.log("Writing data")
  if (matches.length>0){
    fs.writeFile("./songs.json", JSON.stringify(matches),
      err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
    }
  if (review.size>0){
    fs.writeFile("./review.json", JSON.stringify(Object.fromEntries(review)),
      err => {
        if (err) {
          console.error(err)
          return
        }
      //file written successfully
    })
  }
  if (failures.length){
    fs.writeFile("./failures.json", JSON.stringify(failures),
      err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
  }
}

const start = async () => {
    logger.info(`Run started. id:${runId}`)
    let alphaNumeric = /[a-z-A-Z]/
    let count = 0
    let token = await getToken()
    await kuroshiro.init(new KuromojiAnalyzer())
    for (let song of dataJson){
        count++
        console.log(`Processing ${count} of ${dataJson.length}`)
        let queries = []
        let artistsList = getArtists(song.artist)
        let jpConvert = wanakana.toKatakana(song.enName,  { customKanaMapping: { lu: 'ル', la: 'ラ', li:"り", le:"レ", lo:"ロ" }})
        let validConvert = true
        if (alphaNumeric.test(jpConvert)){
          validConvert = false
        }
        if (artistsList.en.length <= 2){
            if (artistsList.same){
              if (song.jpName!==""){
                queries.push(`${song.jpName} artist:${artistsList.en.join(" ")}`)
                queries.push(`${song.jpName}`)
              } 
              if (validConvert){
                queries.push(`${jpConvert} artist:${artistsList.en.join(" ")}`)
                queries.push(`${jpConvert}`)
              }
            } else  {
              if (song.jpName!==""){
                queries.push(`${song.jpName} artist:${artistsList.jp.join(" ")}`)
                queries.push(`${song.jpName} artist:${artistsList.en.join(" ")}`)
                queries.push(`${song.jpName}`)
              } else if (validConvert) {
                queries.push(`${jpConvert} artist:${artistsList.jp.join(" ")}`)
                queries.push(`${jpConvert} artist:${artistsList.en.join(" ")}`)
                queries.push(`${jpConvert}`)
              }
              queries.push(`${song.enName} artist:${artistsList.jp.join(" ")}`)
            }
            queries.push(`${song.enName} artist:${artistsList.en.join(" ")}`)
            queries.push(`${song.enName}`)
        } else {
          if (song.jpName!==""){
            queries.push(`${song.jpName}`)
          } else if (validConvert){
            queries.push(`${jpConvert}`)
          }
          queries.push(`${song.enName}`)
        }
        console.log(`Getting ${song.anime} - ${song.enName}`)
        for (let query of queries){
            let res = await getMatches(token, query, song, artistsList, "JP")
            if (!res) {
              res = await getMatches(token, query, song, artistsList, "US")
            }
            await sleep(200)
            if (res){
              break
            }
        }
        if (review.has(`${song.anime} - ${song.enName}`)){
            console.warn(`To review ${song.enName}`)
            reviewLogger.warn({data:review.get(`${song.anime} - ${song.enName}`)}, `To review ${song.enName}`)
        }
        if (failures.includes(`${song.anime} - ${song.enName}`)){
          console.error(`Failed ${song.enName}`)
          failureLogger.error(`Failed ${song.enName}`)
        }
    }
    writeData()
}
start() 