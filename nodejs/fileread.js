var fs = require('fs');
fs.readFile('sample.txt', (err, data) => {
    console.log(data);
});