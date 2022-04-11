const fs = require('fs')

let str = fs.readFileSync("data.json")
let json = JSON.parse(str).length
console.log(json)