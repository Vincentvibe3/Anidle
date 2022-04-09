import { songs } from "./songs"

const addScoreEntry = (map:Map<number, string[]>, score:number, entry:string)=>{
    if (map.has(score)){
        map.get(score).push(entry)
    } else {
        map.set(score, [entry])
    }
}

export let getSuggestions = (query:string, max:number)=>{
    if (query.trim() ==""){
        return []
    }
    const reNonWord = /\W/
    const scores:Map<number, string[]> = new Map()
    let results = []
    const words = query.toLowerCase().split(reNonWord).filter(i => i)
    console.log(words)
    for (let song of songs){
        let name = song.name.toLowerCase()
        if (name.startsWith(query)){
            addScoreEntry(scores, words.length+1, song.name)
        } else {
            let score = 0
            for (let word of words){
                console.log(word)
                if (name.includes(word)){
                    score++
                }
            }
            addScoreEntry(scores, score, song.name)
        }
    }
    let added = 0
    let sortedScores = Array.from(scores.keys()).sort().reverse()
    console.log(sortedScores)
    for (let score of sortedScores){
        if (score==0){
            break
        }
        let items = scores.get(score)
        for (let item of items){
            results.push(item)
            added++
            if (added==max){
                break
            }
        }
        if (added==max){
            break
        }
    }
    return results
}