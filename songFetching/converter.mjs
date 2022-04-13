import * as fs from "fs"
let args = process.argv
let source = args[2]
let destination = args[3]
let templatePath = args[4]

let data = fs.readFileSync(source).toString()
let template = fs.readFileSync(templatePath).toString()
if (data!=="") {
    fs.writeFile(destination, template.replace("%songs%", data),
        err => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            //file written successfully
        })
}
console.log("conversion done")
