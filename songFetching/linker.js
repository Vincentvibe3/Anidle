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

let punctuation = /[.,\"\/#!$%\^&\*;:{}=\-'_`~()?]/g

let matches = []
let failures = []
let review = new Map()

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
      for (let artist of item.artists){
        spArtists.push(artist.name)
      }
      if (await checkTitle(item.name, info.enName, info.jpName)){
        if (await checkArtist(spArtists, artists.comparison)){
          console.log(`Found ${info.enName}`)
          removeFail(`${info.anime} - ${info.enName}`)
          removeReview(`${info.anime} - ${info.enName}`)
          matches.push({
            id:item.id,
            name:`${info.anime} - ${info.enName}`
          })
          return true
        } else {
          tempReview.push(
            {
              id:item.id,
              url:item.external_urls.spotify
            }
          )
        }
      } 
    }
    if (tempReview.length!=0){
      console.log(`To review ${info.enName}`)
      removeFail(`${info.anime} - ${info.enName}`)
      addReview(`${info.anime} - ${info.enName}`, tempReview)
    } else {
      addFail(`${info.anime} - ${info.enName}`)
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
        comparison.push(en.replace(" ", "").replace(punctuation, ""))
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
        let cleanPunct = spArtist.replace(punctuation, "")
        let clean1 = (await formatForComparison(cleanPunct)).replace(" ", "").toLowerCase()
        let clean2 = (await formatForComparison(cleanPunct)).split(" ").reverse().join("").toLowerCase()
        let clean3 = (await formatForComparison(cleanPunct)).replace("ou", "o").split(" ").reverse().join("").toLowerCase()
        let clean4 = (await formatForComparison(cleanPunct)).replace("ou", "o").split(" ").reverse().join("").toLowerCase()
        console.log(clean1)
        console.log(clean2)
        console.log(clean3)
        console.log(clean4)
        console.log(artists)
        if (artists.includes(clean1)||artists.includes(clean2)||artists.includes(clean3)||artists.includes(clean4)){
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
    .replace(uHepburn, "uu")
    .replace(oHepburn, "oo")
}

const checkTitle = async (spTitle, title, jpTitle) => {
  let jpConvert = wanakana.toKatakana(title, { customKanaMapping: { lu: 'ル', la: 'ラ', li:"り", le:"レ", lo:"ロ" }})
  let spCleanPunct = spTitle.replace(punctuation, "").toLowerCase()
  let jpOk = false
  if (jpTitle!=""){
    let spCleanPunctRaw = spTitle.replace(punctuation, "").toLowerCase()
    let jpTitleCleanPunct = jpTitle.replace(punctuation, "").toLowerCase()
    jpOk = (spCleanPunctRaw.includes(jpTitleCleanPunct)||jpTitleCleanPunct.includes(spCleanPunctRaw))
  }
  let titleCleanPunct = title.replace(punctuation, "").toLowerCase()
  let jpcTitleCleanPunct = jpConvert.replace(punctuation, "").toLowerCase()
  let spClean = replaceModHepburn((await formatForComparison(spCleanPunct)).replace(" ", ""))
  let titleClean = replaceModHepburn(titleCleanPunct.replace(" ", ""))
  let jpcTitleClean = replaceModHepburn((await formatForComparison(jpcTitleCleanPunct)).replace(" ", ""))
  return (spClean.includes(titleClean)||titleClean.includes(spClean)||spClean.includes(jpcTitleClean)||jpOk)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const writeData = async () => {
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
    fs.writeFile("./review.json", JSON.stringify(Object.fromEntries(review)),
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
    let alphaNumeric = /[a-z-A-Z]/
    let token = await getToken()
    await kuroshiro.init(new KuromojiAnalyzer())
    for (let song of dataJson){
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
            console.log(query)
            let res = await getMatches(token, query, song, artistsList, "JP")
            if (!res) {
              res = await getMatches(token, query, song, artistsList, "US")
            }
            await sleep(200)
            if (res){
              break
            }
        }
    }
    writeData()
}
start()