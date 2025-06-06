import express from 'express';
import Handlebars from 'handlebars';
import session from 'express-session';
const app = express();
import configRoutes from './routes/index.js';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticDir = express.static(__dirname + '/public');

import exphbs from 'express-handlebars';

const handlebarsInstance = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    asJSON: (obj, spacing) => {
      if (typeof spacing === 'number')
        return new Handlebars.SafeString(JSON.stringify(obj, null, spacing));

      return new Handlebars.SafeString(JSON.stringify(obj));
    }
  },
  partialsDir: ['views/partials/']
});

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req.body && req.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }

  // let the next middleware run:
  next();
};

app.use('/public', staticDir);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(rewriteUnsupportedBrowserMethods);

app.engine('handlebars', handlebarsInstance.engine);
app.set('view engine', 'handlebars');
//app.get('/favicon.ico', (req, res) => res.status(204));

app.use(
    session({
        name: 'AuthState',
        secret: 'something secret',
        saveUninitialized: false,
        resave: false,
        cookie: {maxAge: 1000 * 60 * 60}
    })
);

app.use('/', (req, res, next) => {
    const timestamp = new Date().toUTCString();
    const method = req.method;
    const url = req.originalUrl;
    const isAuthenticated = req.session && req.session.user;
    const authStatus = isAuthenticated ? 'Authenticated User' : 'Non-Authenticated User';

    console.log(`[${timestamp}]: ${method} ${url} (${authStatus})`);

    if (!isAuthenticated && (url === '/profile' || url === '/admin')) {
        return res.status(403).render('error', {statusCode: 403, message: 'Unauthorized: Please log in to access this page.'});
    }

    next();
});

configRoutes(app);

app.listen(3000, () => {
    console.log('We have now got a server!');
    console.log('Your routes will be running on http://localhost:3000');
});

