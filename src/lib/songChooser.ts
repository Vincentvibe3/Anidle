import { songs } from "./songs"
import type { Song } from "./songs"

export const getSong = ():Song => {
    const epoch = new Date(2022, 0, 1).valueOf()
    const currentTime = Date.now()
    const index = Math.floor((currentTime-epoch)/86400000)
    return songs[index%songs.length]
}