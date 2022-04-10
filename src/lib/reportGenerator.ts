export interface Attempt{
    text:string,
    success:boolean
    skipped:boolean
}

export const getReport = (attempts:Attempt[], maxAttempts:number):string=>{
    let green = "🟩"
    let black  = "⬛"
    let red = "🟥"
    let white ="⬜"
    let output = ""
    for (let attempt of attempts){
        if(attempt.success){
            output+=green
        } else {
            if (attempt.skipped){
                output+=white
            } else {
                output+=red
            }
        }
    }
    for (let _ of [...Array(maxAttempts-attempts.length).keys()]){
        output+=black
    }
    return output
}