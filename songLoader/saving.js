import * as fs from "fs"
import * as stringSimilarity from "string-similarity"

// From https://stackoverflow.com/a/2450976
export const shuffleData = async (data) => {
    let currentIndex = data.length,  randomIndex;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [data[currentIndex], data[randomIndex]] = [
        data[randomIndex], data[currentIndex]];
    }

    return data;
}

const checkDuplicates = (newData, old) => {
    let keep = []
    for (let data of old){
        let dup = false
        for (let newEntry of newData){
            let sim = stringSimilarity.compareTwoStrings(data.guessString, newEntry.guessString)
            if (sim>=0.75){
                dup = true
                break
            }
        }
        if (!dup){
            keep.push(data)
        }
    }
    return keep
}

export const saveData = async (data, destination) => {
    console.log("Getting old data")
    let existingData = null
    let finalDestination
    try {
        let existingRawData = fs.readFileSync(destination)
        if (existingRawData.length!==0){
            existingData = JSON.parse(existingRawData)
        }
        finalDestination = destination
    } catch(err) {
        if (err.name=="SyntaxError"){
            console.warn("Existing data is malformed")    
            console.warn("Dumping to alternate file")
            finalDestination = destination+"-newdata.json"
        } else {
            if (err.code==="ENOENT"){
                console.warn("Cannot find destination file")
                console.warn("No existing data will be merged")
                finalDestination = destination
            }
        }
    }
    
    let newData
    if (existingData!==null){
        let currentIndex = existingData.length
        for (let entry of data){
            currentIndex++
            entry.index = currentIndex
        }
        console.log("Merging data")
        existingData = checkDuplicates(data, existingData)
        newData = existingData.concat(data)
    } else {
        let currentIndex = 0
        for (let entry of data){
            currentIndex++
            entry.index = currentIndex
        }
        newData = data
    }
    console.log("Writing data")
    fs.writeFileSync(finalDestination, JSON.stringify(newData, undefined, 4),
        err => {
            if (err) {
                console.error(err)
                logger.error(err, "Failed to save file")
                process.exit(1)
            }
        }
    )
}

export const saveSlugs = (slugs) => {
    fs.writeFileSync("slugs.json", JSON.stringify(slugs),
    err => {
        if (err) {
            console.error("Failed to save slugs")
            logger.error(err, "Failed to save slugs")
        }
    })
}

export const loadSlugs = () => {
    try {
        let existingRawData = fs.readFileSync("slugs.json")
        if (existingRawData.length!==0){
            return JSON.parse(existingRawData)
        }
    } catch(err) {
        return []
    }
}