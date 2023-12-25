var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var template = require('./lib/template');
var cookie = require('cookie');

function authIsOwner(req, res) {
    var isOwner = false;
    var cookies = {};
    if(req.headers.cookie) {
        cookies = cookie.parse(req.headers.cookie);
    }
    // console.log(cookies)
    if(cookies.email === 'ek10314@naver.com' && cookies.password === '111111') {
        isOwner = true;
    }
    // console.log(isOwner)
    return isOwner;
}

function authStatusUI(req, res) {
    var authStatusUI = '<a href="/login">login</a>';
    if(authIsOwner(req, res) === true) {
        authStatusUI = '<a href="/logout_process">logout</a>';
    }

    return authStatusUI;
}

var app = http.createServer((req, res) => {
    var _url = req.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    //console.log(pathname)

    if(pathname === '/') {
        
        if(queryData.id === undefined) {

            fs.readdir('./data', (err, fileList) => {
                
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = template.list(fileList);
                
                var html = template.html(title, list, 
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create</a>`,
                    authStatusUI(req, res)
                );

                res.writeHead(200);
                res.end(html);
            })

        } else {
            fs.readdir('./data', (err, fileList) => {
                var filteredId = path.parse(queryData.id).base;
                fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
                    var title = queryData.id;
                    var sanitizedTitlte = sanitizeHtml(title);
                    var sanitizedDescription = sanitizeHtml(description, {
                        allowedTags: ['h1']
                    });
                    var list = template.list(fileList);
                    var html = template.html(sanitizedTitlte, list, 
                        `<h2>${sanitizedTitlte}</h2>${sanitizedDescription}`,
                        `
                            <a href="/create">create</a> 
                            <a href="/update?id=${sanitizedTitlte}">update</a>
                            <form action="delete_process" method="post">
                                <input type="hidden" name="id" value="${sanitizedTitlte}" >
                                <input type="submit" value="delete">
                            </form>
                        `, authStatusUI(req, res)
                    );
                    res.writeHead(200);
                    res.end(html);
                });
            })
        }
    } else if(pathname === '/create') {
        fs.readdir('./data', (err, fileList) => {

            if(authIsOwner(req, res) === false) {
                res.end('login required!!');
                return false;
            }
                
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
            `, '', authStatusUI(req, res));

            res.writeHead(200);
            res.end(html);
        })
    } else if(pathname === '/create_process') {

        if(authIsOwner(req, res) === false) {
            res.end('login required!!');
            return false;
        }

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

        if(authIsOwner(req, res) === false) {
            res.end('login required!!');
            return false;
        }        

        fs.readdir('./data', (err, fileList) => {
            var filteredId = path.parse(queryData.id).base;
            fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
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
                    `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`, authStatusUI(req, res)
                );
                res.writeHead(200);
                res.end(html);
            });
        })
    } else if(pathname === '/update_process') {
        
        if(authIsOwner(req, res) === false) {
            res.end('login required!!');
            return false;
        }

        var body = '';
        req.on('data', (data) => { // POST방식으로 data를 전송할 때
            body += data;
        })
        req.on('end', () => { // data가 모두 전송된 후에
            var post = qs.parse(body); // data를 객체화함
            var id = post.id;
            var filteredId = path.parse(post.id).base;
            var title = post.title;
            var description = post.description;
            
            fs.rename(`data/${filteredId}`, `data/${title}`, (err) => {
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
            var filteredId = path.parse(post.id).base;
            
            fs.unlink(`data/${filteredId}`, function(err) {
                if(err) throw err;
                console.log(`data/${filteredId} file deleted`);

                res.writeHead(302, 
                    {Location: `/`}
                );
                res.end();
            });
        })
    } else if(pathname === '/login') {
        fs.readdir('./data', (err, fileList) => {
                
            var title = 'Login';
            var list = template.list(fileList);
            
            var html = template.html(title, list, 
                `<form action="login_process" method="post">
                    <p><input type="text" name="email" placeholder="email"></p>
                    <p><input type="password" name="password" placeholder="password"></p>
                    <p><input type="submit"></p>
                </form>`,
                `<a href="/create">create</a>`
            );

            res.writeHead(200);
            res.end(html);
        })
    } else if(pathname === '/login_process') {
        var body = '';
        req.on('data', (data) => { // POST방식으로 data를 전송할 때
            body += data;
        })
        req.on('end', () => { // data가 모두 전송된 후에
            var post = qs.parse(body); // data를 객체화함
            if(post.email == 'ek10314@naver.com' && post.password == '111111') {
                res.writeHead(302, {
                    "Set-Cookie": [
                        `email=${post.email}`,
                        `password=${post.password}`,
                        `nickname=SSong`
                    ],
                    Location: `/`
            });
            res.end();
            } else {
                res.end('Who?');
            }        
           
            
        })
    } else if(pathname === '/logout_process') {
        
        if(authIsOwner(req, res) === false) {
            res.end('login required!!');
            return false;
        }
        
        var body = '';
        req.on('data', (data) => { // POST방식으로 data를 전송할 때
            body += data;
        })
        req.on('end', () => { // data가 모두 전송된 후에
            var post = qs.parse(body); // data를 객체화함
            res.writeHead(302, {
                "Set-Cookie": [
                    `email=; Max-Age=0`,
                    `password=; Max-Age=0`,
                    `nicknam=; Max-Age=0`
                ],
                Location: `/`
            });
            res.end();
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    };
   
});

app.listen(3000);