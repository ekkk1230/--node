var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

function templateHTML(title, list, body, control) {
    return `
    <!doctype html>
        <html>
            <head>
                <title>WEB1 - ${title}</title>
                <meta charset="utf-8">
            </head>
        <body>
            <h1><a href="/">WEB</a></h1>
            
            ${list}

            ${control}

            ${body}
            
        </body>
        </html>
`;
}

function templateList(fileList) {
    var list = '<ul>';

    var i = 0;
    while(i < fileList.length) {
        list = list + `<li><a href="/?id=${fileList[i]}">${fileList[i]}</a></li>`;
        i = i + 1;
    }
    list = list + '</ul>';

    return list;
}

var app = http.createServer((req, res) => {
    var _url = req.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    console.log(pathname)
    
    if(pathname === '/') {
        
        if(queryData.id === undefined) {

            fs.readdir('./data', (err, fileList) => {
                
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = templateList(fileList);
                
                var template = templateHTML(title, list, 
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create<a>`
                );

                res.writeHead(200);
                res.end(template);
            })

        } else {
            fs.readdir('./data', (err, fileList) => {
                fs.readFile(`data/${queryData.id}`, 'utf8', (err, description) => {
                    var title = queryData.id;
                    var list = templateList(fileList);
                    var template = templateHTML(title, list, 
                        `<h2>${title}</h2>${description}`,
                        `<a href="/create">create<a> <a href="/update?id=${title}">update<a>`
                    );
                    res.writeHead(200);
                    res.end(template);
                });
            })
        }
    } else if(pathname === '/create') {
        fs.readdir('./data', (err, fileList) => {
                
            var title = 'WEB - create';

            var list = templateList(fileList);
            
            var template = templateHTML(title, list, `
                <form action="/create_process" method="post">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                </form>
            `, '');

            res.writeHead(200);
            res.end(template);
        })
    } else if(pathname === '/create_process') {
        var body = '';
        req.on('data', (data) => { // POST방식으로 data를 전송할 때
            body += data;
        })
        req.on('end', () => { // data가 모두 전송된 후에
            var post = qs.parse(body); // data를 객체화함
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
                if (err) throw err;
                console.log(`${title} file saved`);
                
                res.writeHead(302, 
                    {Location: `/?id=${title}`}
                );
                res.end();
            })
        })
    } else if(pathname === '/update') {
        fs.readdir('./data', (err, fileList) => {
            fs.readFile(`data/${queryData.id}`, 'utf8', (err, description) => {
                var title = queryData.id;
                var list = templateList(fileList);
                var template = templateHTML(title, list, 
                    `
                        <form action="/update_process" method="post">
                            <input type="hidden" name="id" value="${title}">
                            <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                            <p>
                                <textarea name="description" placeholder="description">${description}</textarea>
                            </p>
                            <p>
                                <input type="submit">
                            </p>
                        </form>
                    `,
                    `<a href="/create">create<a> <a href="/update?id=${title}">update<a>`
                );
                res.writeHead(200);
                res.end(template);
            });
        })
    }  else if(pathname === '/update_process') {
        var body = '';
        req.on('data', (data) => { // POST방식으로 data를 전송할 때
            body += data;
        })
        req.on('end', () => { // data가 모두 전송된 후에
            var post = qs.parse(body); // data를 객체화함
            var id = post.id;
            var title = post.title;
            var description = post.description;
            
            fs.rename(`data/${id}`, `data/${title}`, (err) => {
                fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
                    if (err) throw err;
                    console.log(`${title} file update!`);
                    
                    res.writeHead(302, 
                        {Location: `/?id=${title}`}
                    );
                    res.end();
                })
            })
        })
    } else {
        res.writeHead(404);
        res.end('Not Found');
    };
   
});

app.listen(3000);