const fs = require("fs");
const request = require("request");
const errorPre = "\x1b[41m\x1b[37m[ERROR]\x1b[0m ";
const successPre = "\x1b[46m\x1b[30m[INFO]\x1b[0m ";

let url = process.argv[2];
let name = process.argv[3];
const regex = /(.*)(\?)/gm;

const regexName = /(icon\/)(.*)(_[0-9]*)/gm;
const m = regexName.exec(url);
const baseName = m[2];

if (!name) {
    name = baseName;
}
const downloadFolder = process.env.HOME + "/Downloads/";

const regexUrl = /(.*)(\?)/gm;
const m3 = regexUrl.exec(url);
if (m3) {
    url = m3[1];
}

request(url, function (error, response, body) {
    const regex = /(<span class="username" title=")(.*)(")/gm;
    const m2 = regex.exec(body);
    const author = m2[2];
    console.log("URL : " + url);
    console.log("Author : " + author);
    console.log("Name : " + name);
    const svgFile = downloadFolder + baseName + ".svg";
    if (fs.statSync(svgFile)) {
        let svg = fs.readFileSync(svgFile).toString();
        svg = svg.replace(/(\r\n|\n|\r)/gm,""); // New lines
        svg = svg.replace(/(\t)/gm," "); // Tabs
        svg = svg.replace(/<!--[\s\S]*?-->/g,""); // HTML commments
        svg = svg.replace(/<\?xml[\s\S]*?\?>/g,""); // XML tag
        svg = svg.replace(/style="[\s\S]*?"/g,""); // Styles
        const comment = "<!-- Credits : " + author + " / " + url + " -->";
        svg = comment + svg;
        const icons = JSON.parse(fs.readFileSync("./icons-svg.json").toString());
        if (icons[name]) {
            console.error(errorPre + "Icon " + name + " already exist");
        } else {
            icons[name] = svg;
            fs.writeFileSync("./icons-svg.json", JSON.stringify(icons, null, 2));
            console.log(successPre + "Icon " + name + "added successfully !");
        }
    } else {
        console.error(errorPre + "File " + svgFile + " not found");
    }
});
