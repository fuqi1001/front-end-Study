var Koa = require('koa');
var Router = require('koa-router');
var bodyParser = require('koa-body');
var Pug = require('koa-pug');
var session = require('koa-session');
var auth = require('koa-basic-auth');
var path = require('path')
var staticCache = require('koa-static-cache');
var mongoose = require('mongoose');
var logger = require('koa-logger')

var app = new Koa();
var router = new Router();
var pug = new Pug({
    viewPath: './views',
    basedir: './views',
    app: app
});
mongoose.connect('mongodb://localhost:27017/my_db');

app.use(logger());
app.keys = ['session']
app.use(session(app));

const credentials = { name: 'qi', pass: 'China' }

app.use(bodyParser({
    formidable: { uploadDir: './uploads' },
    multipart: true,
    urlencoded: true
}));

router.get('/', (ctx, next) => {
    //ctx.render('form');
    ctx.cookies.set('foo', 'bar', { httpOnly: false });

    var n = ctx.session.views || 0;
    ctx.session.views = ++n;
    if (n == 1)
        ctx.body = 'Welcome here for the first time!'
    else
        ctx.body = "You've visited this page " + n + " times!"
})

router.post('/', (ctx, next) => {
    console.log(ctx.request.body);
    console.log(ctx.req.body);

    ctx.body = ctx.request.body;
})

router.get('/files', (ctx, next) => {
    ctx.render('file_upload')
});

router.post('/upload', (ctx, next) => {
    console.log("Files: ", ctx.request.body.files);
    console.log("Fields: ", ctx.request.body.fields);
    ctx.body = "Received your data!";
})

// authentication
// curl -H "Authorization: basic dGo6dG9iaQ==" http://localhost:3000/ -i

router.get('/protected', auth(credentials), async (ctx, next) => {
    ctx.body = 'You have access to the protected area.';
    await next();
});

router.get('/unprotected', async (ctx, next) => {
    ctx.body = 'Anyone can access this area';
    await next();
})



/*
router.get('/', (ctx, next) => {
    // ctx.router available
    
    ctx.body = 'hello world'
    console.log(ctx.response);
});

router.get('/hello', (ctx, next) => {
    ctx.body = 'lalala'
})

router.get('/:id([0-9]{5})', (ctx, next) => {
   ctx.body = `the  id is ${ctx.params.id}`
})
*/

// use mongodb
var personSchema = mongoose.Schema({
    name: String,
    age: Number,
    nationality: String
})

var Person = mongoose.model("Person", personSchema);

router.get('/person', async (ctx, next) => {
    ctx.render('person');
    await next();
})
router.post('/person', async (ctx, next) => {
    var self = ctx;
    var personInfo = self.request.body;
    if (!personInfo.name || !personInfo.age || !personInfo.nationality) {
        //self.render('show_message', { message: 'invalid input', type: "error" })
        self.body = {
            message: 'invalid input',
            type: 'error'
        }
    } else {
        var newPerson = new Person({
            name: personInfo.name,
            age: personInfo.age,
            nationality: personInfo.nationality
        })


        try {
            let newPeople = await newPerson.save();
            self.body = {
                message: 'added',
                type: 'success',
                person: personInfo
            }
            //self.render('show_message', {message: 'added', type: 'success', person: personInfo})
        } catch (err) {
            ctx.body = err;
        }

        //ctx.body = "received"
    }
})


// 404 redirect
router.get('/not_found', (ctx, next) => {
    ctx.status = 404;
    ctx.body = 'page not found'
})
app
    .use(router.routes())
    .use(router.allowedMethods())
    .use(async (ctx, next) => {
        if (404 != ctx.status) return;
        ctx.redirect('/not_found')

        try {
            await next();
        } catch (err) {
            if (401 == err.status) {
                ctx.status = 401;
                ctx.set('WWW-Authenticate', 'Basic');
                ctx.body = 'You have no access here';
            } else {
                throw err;
            }
        }
    })
    /*.use(staticCache(path.join(__dirname, 'public'), {
        maxAge: 365 * 24 * 60 * 60
    }))*/;


/*app.use( (ctx, next) => {
    ctx.body = 'hello world'
})*/
app.listen(3000);