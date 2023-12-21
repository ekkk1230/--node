var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template');

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
                var list = template.list(fileList);
                
                var html = template.html(title, list, 
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create</a>`
                );

                res.writeHead(200);
                res.end(html);
            })

        } else {
            fs.readdir('./data', (err, fileList) => {
                fs.readFile(`data/${queryData.id}`, 'utf8', (err, description) => {
                    var title = queryData.id;
                    var list = template.list(fileList);
                    var html = template.html(title, list, 
                        `<h2>${title}</h2>${description}`,
                        `
                            <a href="/create">create</a> 
                            <a href="/update?id=${title}">update</a>
                            <form action="delete_process" method="post">
                                <input type="hidden" name="id" value="${title}" >
                                <input type="submit" value="delete">
                            </form>
                        `
                    );
                    res.writeHead(200);
                    res.end(html);
                });
            })
        }
    } else if(pathname === '/create') {
        fs.readdir('./data', (err, fileList) => {
                
            var title = 'WEB - create';

            var list = template.list(fileList);
            
            var html = template.html(title, list, `
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
            res.end(html);
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
                var list = template.list(fileList);
                var html = template.html(title, list, 
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
                    `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
                );
                res.writeHead(200);
                res.end(html);
            });
        })
    } else if(pathname === '/update_process') {
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
    } else if(pathname === '/delete_process') {
        var body = '';
        req.on('data', (data) => { // POST방식으로 data를 전송할 때
            body += data;
        })
        req.on('end', () => { // data가 모두 전송된 후에
            var post = qs.parse(body); // data를 객체화함
            var id = post.id;
            
            fs.unlink(`data/${id}`, function(err) {
                if(err) throw err;
                console.log(`data/${id} file deleted`);

                res.writeHead(302, 
                    {Location: `/`}
                );
                res.end();
            });
        })
    } else {
        res.writeHead(404);
        res.end('Not Found');
    };
   
});

app.listen(3000);