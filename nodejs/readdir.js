var testFolder = './data';
var fs = require('fs');

fs.readdir(testFolder, (err, filelist) => {
    filelist.forEach(file => {
        console.log(file)
    })
})