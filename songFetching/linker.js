const wanakana = require('wanakana');
const axios = require('axios')

const client_id = process.env.SPOTIFY_CLIENT
const client_secret = process.env.SPOTIFY_SECRET
const fs = require('fs')
let datastr = fs.readFileSync("data.json")
let dataJson = JSON.parse(datastr)

const Kuroshiro = require("kuroshiro").default
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji");
const kuroshiro = new Kuroshiro();

let matches = []
let failures = []
let review = []

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

const getMatches = async (accessToken, query, info, artists)=>{
    let url = encodeURI(`https://api.spotify.com/v1/search?q=${query}&market=JP&type=track`)
    let response = await axios.get(url,{ 
            headers:{
                "Authorization":`Bearer ${await accessToken}`,
                "Accept":"application/json",
                "Content-Type": "application/json"
            }
        }
    )
    let data = response.data
    for (let item of data.tracks.items){
      let spArtists = []
      for (let artist of item.artists){
        spArtists.push(artist.name)
      }
      if (await checkTitle(item.name, info.enName)){
        if (await checkArtist(spArtists, artists.comparison)){
          matches.push({
            id:item.id,
            name:`${info.anime} - ${info.enName}`
          })
          return true
        } else {
          review.push(
            {
              id:item.id,
              name:`${info.anime} - ${info.enName}`,
              url:data.external_urls.spotify
            }
          )
        }
      } else {
        failures.push({name:`${info.anime} - ${info.enName}`})
      }
    }
    return false
}

const getArtists = (artists) => {
    let matcher = /,|feat.|ft.|and/
    let listPrelim = artists.split(matcher)
    let jpArtists = []
    let enArtists = []
    let comparison = []
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
        comparison.push(en.replace(" ", "").replace(/[.,\"\/#!$%\^&\*;:{}=\-_`~()\s]/g, ""))
    }
    return {
        en:enArtists,
        jp:jpArtists,
        comparison:comparison,
        same:same
    }
}

const formatForComparison = async (str) => {
    let result = await kuroshiro.convert(str, { to: "romaji" })
    return result
}

const checkArtist = async (spotifyArtists, artists) => {
    for (let spArtist of spotifyArtists){
        let cleanPunct = spArtist.replace(/[.,\"\/#!$%\^&\*;:{}=\-_`~()\s]/g, "")
        let clean = (await formatForComparison(cleanPunct)).replace(" ", "").toLowerCase()
        if (artists.includes(clean)){
          return true
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
    .replace(uHepburn, "u")
    .replace(oHepburn, "o")
}

const checkTitle = async (spTitle, title) => {
  let spCleanPunct = spTitle.replace(/[.,\"\/#!$%\^&\*;:{}=\-_`~()\s]/g, "").toLowerCase()
  let titleCleanPunct = title.replace(/[.,\"\/#!$%\^&\*;:{}=\-_`~()\s]/g, "").toLowerCase()
  let spClean = replaceModernHepburn((await formatForComparison(spCleanPunct)).replace(" ", ""))
  let titleClean = replaceModHepburn(titleCleanPunct.replace(" ", ""))
  return (spClean.includes(titleClean)||titleClean.includes(spClean))
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const writeData = async () => {
  while(!songFetchDone){
    await sleep(10)
  }
  console.log("Writing data")
  if (ids.length>0){
    fs.writeFile("./songs.json", JSON.stringify(matches),
      err => {
        if (err) {
          console.error(err)
          return
        }
        //file written successfully
      })
    fs.writeFile("./review.json", JSON.stringify(review),
      err => {
        if (err) {
          console.error(err)
          return
        }
      //file written successfully
    })
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
    let token = await getToken()
    await kuroshiro.init(new KuromojiAnalyzer())
    for (let song of dataJson){
        let queries = []
        let artistsList = getArtists(song.artist)
        if (artistsList.en.length <= 2){
            if (artistsList.same){
                queries.push(`${song.jpName} artist:${artistsList.en.join(" ")}`)
                queries.push(`${song.enName} artist:${artistsList.en.join(" ")}`)
            } else  {
                queries.push(`${song.jpName} artist:${artistsList.jp.join(" ")}`)
                queries.push(`${song.jpName} artist:${artistsList.en.join(" ")}`)
                queries.push(`${song.enName} artist:${artistsList.jp.join(" ")}`)
                queries.push(`${song.enName} artist:${artistsList.en.join(" ")}`)
            }
        }
        console.log(`Getting ${song.anime} - ${song.enName}`)
        for (let query of queries){
            let res = await getMatches(token, query, song, artistsList)
            await sleep(200)
            if (res){
              break
            }
        }
    }
    writeData()
}
start()