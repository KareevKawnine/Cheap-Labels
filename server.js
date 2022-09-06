if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const dotenv = require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate');
const qs = require('qs')
const request = require('request');
const bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))

// parse application/json
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));
const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = []
app.set('view-engine', 'ejs')
app.use(express.urlencoded({
  extended: false
}))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.engine('ejs', ejsMate);


app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', {
    name: req.user.name
  })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})


//Order a Label and API stuffs
app.get('/order-labels', checkAuthenticated, (req, res) => {
  res.render('order-labels.ejs', {
    name: req.user.name
  })
})

app.post('/order-labels', checkAuthenticated, (req, res) => {
  var options = {
    'method': 'POST',
    'url': 'https://labelsupply.io/api/order',
    'headers': {
      'X-Api-Auth': `${req.body.key}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'Type': `${req.body.Type}`,
      'Weight': parseFloat(req.body.Weight),
      'FromCountry': req.body.FromCountry,
      'FromName': req.body.FromName,
      'FromStreet': req.body.FromStreet,
      'FromCity': req.body.FromCity,
      'FromState': req.body.FromState,
      'FromZip': req.body.FromZip,
      'ToCountry': req.body.ToCountry,
      'ToName': req.body.ToName,
      'ToStreet': req.body.ToStreet,
      'ToCity': req.body.ToCity,
      'ToState': req.body.ToState,
      'ToZip': req.body.ToZip
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    res.render('order-status.ejs', {
      response
    })
  });
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});



function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(3000, () => {
  console.log("We are on LIVE KIDDO")
})