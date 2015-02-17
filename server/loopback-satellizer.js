var request = require('request');
var qs = require('querystring');
var jwt = require('jwt-simple');
var moment = require('moment');

module.exports = function (app, config) {

var User = app.models[config.USER_MODEL];

var authHeader = config.AUTH_HEADER;

function createToken (user) {
  var payload = {
    sub: user.id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
}

function sendAccessToken (req, res) {
  var user = req.user;
  user.createAccessToken(User.settings.ttl, function (err, token) {
    if (err) {
      res.send(err);
      return;
    }
    token.token = createToken(user);
    res.send(token);
  });
}

app.post('/auth/login', 
  function(req, res, next) {
    User.login({ 
      email: req.body.email, 
      password: req.body.password 
    }, function (err, user) {
      if (!user) {
        res.status(401).send({ message: 'Wrong email and/or password' });
        return;
      }
      req.user = user;
      next();
    });
  }, sendAccessToken);

app.post('/auth/signup', 
  function(req, res, next) {
    User.create({
      displayName: req.body.displayName,
      email: req.body.email,
      password: req.body.password
    }, function (err, user) {
      if (err) {
        res.status(409).send({ message: 'Email is already taken' });
        return;
      }
      req.user = user;
      next();
    });
  }, sendAccessToken);

// GOOGLE
app.post('/auth/google', 
  // Step 1. Exchange authorization code for access token.
  function(req, res, next) {
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.GOOGLE_SECRET,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };
    
    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
      if (response.statusCode !== 200) {
        res.status(500).send(err);
        return;
      }
      var accessToken = token.access_token;
      req.accessToken = accessToken;
      next();
    });
  },

  // Step 2. Retrieve profile information about the current user.
  function (req, res, next) {
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var accessToken = req.accessToken;
    var headers = { Authorization: 'Bearer ' + accessToken };
    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
      if (response.statusCode !== 200) {
        res.status(500).send(err);
        return;
      }
      req.profile = profile;
      next();
    });
  },

  // Step 3a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }
    var profile = req.profile;
    User.find({ where: { google: profile.sub } }, function(err, users) {
      var user = users[0];
      if (user) {
        res.status(409).send({ message: 'There is already a Google account that belongs to you' });
        return;
      }

      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.google = profile.sub;
        user.displayName = user.displayName || profile.name;
        user.save(function() {
          res.send({
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var profile = req.profile;
    var filter = { or: [{ google: profile.sub }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.google) {
          user.google = profile.sub;
          user.displayName = user.displayName || profile.name;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.name,
        google: profile.sub,
        email: profile.email,
        password: profile.sub
      }, function (err, user) {
        if (err) {
          res.status(500).send(err);
          return;
        }
        req.user = user;
        next();
      });

    });
  }, sendAccessToken);

// FACEBOOK
app.post('/auth/facebook', 
  // Step 1. Exchange authorization code for access token.
  function (req, res, next) {
    var accessTokenUrl = 'https://graph.facebook.com/oauth/access_token';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.FACEBOOK_SECRET,
      redirect_uri: req.body.redirectUri
    };

    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
      if (response.statusCode !== 200) {
        res.status(500).send({ message: accessToken.error.message });
        return;
      }
      req.accessToken = qs.parse(accessToken);
      next();
    });
  },

  // Step 2. Retrieve profile information about the current user.
  function (req, res, next) {
    var graphApiUrl = 'https://graph.facebook.com/me';
    var accessToken = req.accessToken;

    request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
      if (response.statusCode !== 200) {
        res.status(500).send({ message: profile.error.message });
        return;
      }
      req.profile = profile;
      next();
    });
  },

  // Step 3a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }
    var profile = req.profile;

    User.find({ where: { facebook: profile.id }}, function(err, users) {
      var user = users[0];
      if (user) {
        res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
        return;
      }
      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.facebook = profile.id;
        user.displayName = user.displayName || profile.name;
        user.save(function() {
          res.send({
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var profile = req.profile;
    var filter = { or: [{ facebook: profile.id }, { email: profile.email }] };

    User.find({ where:  filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.facebook) {
          user.facebook = profile.id;
          user.displayName = user.displayName || profile.name;
          user.save(function () { 
            req.user = user;
            next(); 
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.name,
        facebook: profile.id,
        email: profile.email,
        password: profile.id
      }, function (err, user) {
        if (err) {
          res.send(err);
          return;
        }
        req.user = user;
        next();
      });
    });
  }, sendAccessToken);

// GITHUB
app.post('/auth/github', 
  // Step 1. Exchange authorization code for access token.
  function(req, res, next) {
    var accessTokenUrl = 'https://github.com/login/oauth/access_token';
    var userApiUrl = 'https://api.github.com/user';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.GITHUB_SECRET,
      redirect_uri: req.body.redirectUri
    };

    request.get({ url: accessTokenUrl, qs: params }, function(err, response, accessToken) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.accessToken = qs.parse(accessToken);
      next();
    });
  },

  // Step 2. Retrieve profile information about the current user.
  function (req, res, next) {
    var accessToken = req.accessToken;
    var headers = { 'User-Agent': 'Satellizer' };

    request.get({ url: userApiUrl, qs: accessToken, headers: headers, json: true }, function(err, response, profile) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.profile = profile;
      next();
    });
  },

  // Step 3a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }
    var profile = req.profile;
    User.find({ where: { github: profile.id }}, function(err, users) {
      var user = users[0];
      if (user) {
        res.status(409).send({ message: 'There is already a GitHub account that belongs to you' });
        return;
      }
      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.github = profile.id;
        user.displayName = user.displayName || profile.name;
        user.save(function() {
          res.send({ 
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var profile = req.profile;
    var filter = { or: [{ github: profile.id }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];
      if (user) {

        if (!user.github) {
          user.github = profile.id;
          user.displayName = user.displayName || profile.name;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.name,
        github: profile.id,
        email: profile.email,
        password: profile.id
      }, function (err, user) {
        req.user = user;
        next();
      });

    });
  }, sendAccessToken);

// LINKEDIN
app.post('/auth/linkedin', 
  // Step 1. Exchange authorization code for access token.
  function(req, res, next) {
    var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.LINKEDIN_SECRET,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };

    request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {
      if (response.statusCode !== 200) {
        res.status(response.statusCode).send({ message: body.error_description });
        return;
      }
      var accessToken = body.access_token;
      req.accessToken = accessToken;
      next();
    });
  },

  // Step 2. Retrieve profile information about the current user.
  function (req, res, next) {
    var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address)';
    var accessToken = req.accessToken;
    var params = {
      oauth2_access_token: access_token,
      format: 'json'
    };

    request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.profile = profile;
      next();
    });
  },

  // Step 3a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }

    User.find({ where: { linkedin: profile.id }}, function(err, users) {
      var user = users[0];

      if (user) {
        res.status(409).send({ message: 'There is already a LinkedIn account that belongs to you' });
        return;
      }
      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.linkedin = profile.id;
        user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
        user.save(function() {
          res.send({ 
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var profile = req.profile;
    var filter = { or: [{ linkedin: profile.id }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.linkedin) {
          user.linkedin = profile.id;
          user.displayName = user.displayName || profile.name;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.name,
        linkedin: profile.id,
        email: profile.email,
        password: profile.id
      }, function (err, user) {
        req.user = user;
        next();
      });

    });
  }, sendAccessToken);

// LIVE
app.post('/auth/live', 
  // Step 1. Exchange authorization code for access token.
  function(req, res, next) {
    var accessTokenUrl = 'https://login.live.com/oauth20_token.srf';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.WINDOWS_LIVE_SECRET,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };
    request.post(accessTokenUrl, { form: params, json: true }, function(err, response, data) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.accessToken = data.access_token;
      next();
    })
  },

  // Step 2. Retrieve profile information about the current user.  
  function(req, res, next) {
    var accessToken = req.accessToken;
    var profileUrl = 'https://apis.live.net/v5.0/me?access_token=' + accessToken;
    request.get({ url: profileUrl, json: true }, function(err, response, profile) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.profile = profile;
      next();
    });
  },

  // Step 3a. Link user accounts.  
  function(req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }
    var profile = req.profile;
    User.find({ where: { live: profile.id }}, function(err, users) {
      var user = users[0];

      if (user) {
        res.status(409).send({ message: 'There is already a Windows Live account that belongs to you' });
        return;
      }
      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.live = profile.id;
        user.displayName = user.name;
        user.save(function() {
          res.send({ 
            token: createToken(user), 
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var prifile = req.profile;
    var filter = { or: [{ live: profile.id }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.live) {
          user.live = profile.id;
          user.displayName = user.displayName || profile.name;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.name,
        live: profile.id,
        email: profile.email,
        password: profile.id
      }, function (err, user) {
        if (err) {
          res.status(500).send(err);
          return;
        }
        req.user = user;
        next();
      });
    });
  }, sendAccessToken);

// YAHOO
app.post('/auth/yahoo', 
  // Step 1. Exchange authorization code for access token.
  function (req, res, next) {
    var accessTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
    var clientId = req.body.clientId;
    var clientSecret = config.YAHOO_SECRET;
    var clientSecret64 = new Buffer(clientId + ':' + clientSecret).toString('base64');
    var headers = { Authorization: 'Basic ' + clientSecret64 };
    var formData = {
      code: req.body.code,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };

    request.post({ url: accessTokenUrl, form: formData, headers: headers, json: true }, function(err, response, body) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.accessToken = body.access_token;
      req.xoauth_yahoo_guid = body.xoauth_yahoo_guid;
      next();
    });
  },

  // Step 2. Retrieve profile information about the current user.
  function (req, res, next) {
    var socialApiUrl = 'https://social.yahooapis.com/v1/user/' + req.xoauth_yahoo_guid + '/profile?format=json';
    var headers = { Authorization: 'Bearer ' + req.accessToken };

    request.get({ url: socialApiUrl, headers: headers, json: true }, function(err, response, body) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.profile = body.profile;
      next();
    });
  },

  // Step 3a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }

    var porfile = req.profile;
    User.find({ where: { yahoo: profile.guid }}, function(err, user) {
      if (user) {
        res.status(409).send({ message: 'There is already a Yahoo account that belongs to you' });
        return;
      }
      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.yahoo = profile.guid;
        user.displayName = user.displayName || profile.nickname;
        user.save(function() {
          res.send({ 
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var profile = req.profile;
    var filter = { or: [{ yahoo: profile.guid }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.yahoo) {
          user.yahoo = body.profile.guid;
          user.displayName = user.displayName || body.profile.name;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: body.profile.name,
        yahoo: body.profile.guid,
        email: body.profile.email,
        password: body.profile.guid
      }, function (err, user) {
        req.user = user;
        next();
      });

    });
  }, sendAccessToken);

// TWITTER
app.get('/auth/twitter', 
  // Step 1. Obtain request token for the authorization popup.
  function(req, res, next) {
    var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
    var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
    var authenticateUrl = 'https://api.twitter.com/oauth/authenticate';

    // Step 2. Redirect to the authorization screen.
    if (!req.query.oauth_token || !req.query.oauth_verifier) {
      var requestTokenOauth = {
        consumer_key: config.TWITTER_KEY,
        consumer_secret: config.TWITTER_SECRET,
        callback: config.TWITTER_CALLBACK
      };

      request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
        var oauthToken = qs.parse(body);
        var params = qs.stringify({ oauth_token: oauthToken.oauth_token });

        res.redirect(authenticateUrl + '?' + params);
      });
      return;
    } 

    // Step 3. Exchange oauth token and oauth verifier for access token.
    var accessTokenOauth = {
      consumer_key: config.TWITTER_KEY,
      consumer_secret: config.TWITTER_SECRET,
      token: req.query.oauth_token,
      verifier: req.query.oauth_verifier
    };

    request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, profile) {
      if (err) {
        res.status(500).send(err);
        return;
      } 
      req.profile = qs.parse(profile);
      next();
    });
  },

  // Step 4a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }

    User.find({ where: { twitter: profile.user_id }}, function(err, users) {
      var user = users[0];
      if (user) {
        res.status(409).send({ message: 'There is already a Twitter account that belongs to you' });
        return;
      }
      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          res.status(400).send({ message: 'User not found' });
          return;
        }
        user.twitter = profile.user_id;
        user.displayName = user.displayName || profile.screen_name;
        user.save(function(err) {
          res.send({ 
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 4b. Create a new user account or return an existing one.
  function (req, res, next) {
    var prifile = req.profile;
    var filter = { or: [{ twitter: profile.user_id }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.twitter) {
          user.twitter = profile.user_id;
          user.displayName = user.displayName || profile.name;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }

        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.name,
        yahoo: profile.user_id,
        email: profile.email,
        password: profile.user_id
      }, function (err, user) {
        req.user = user;
        next();
      });

    });
  }, sendAccessToken);

// FOURSQUARE
app.post('/auth/foursquare', 
  // Step 1. Exchange authorization code for access token.
  function(req, res, next) {
    var accessTokenUrl = 'https://foursquare.com/oauth2/access_token';
    var formData = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.FOURSQUARE_SECRET,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };

    request.post({ url: accessTokenUrl, form: formData, json: true }, function(err, response, body) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.accessToken = body.access_token;
      next();
    });
  },

  // Step 2. Retrieve information about the current user.
  function (req, res, next) {
    var profileUrl = 'https://api.foursquare.com/v2/users/self';
    var params = {
      v: '20140806',
      oauth_token: req.accessToken
    };

    request.get({ url: profileUrl, qs: params, json: true }, function(err, response, profile) {
      if (err) {
        res.status(500).send(err);
        return;
      }
      req.profile = profile.response.user;
      next();
    });
  },

  // Step 3a. Link user accounts.
  function (req, res, next) {
    if (!req.headers[authHeader]) {
      next();
      return;
    }

    User.find({ where: { foursquare: profile.id }}, function(err, users) {
      var user = users[0];

      if (user) {
        return res.status(409).send({ message: 'There is already a Foursquare account that belongs to you' });
      }

      var token = req.headers[authHeader].split(' ')[1];
      var payload = jwt.decode(token, config.TOKEN_SECRET);
      User.findById(payload.sub, function(err, user) {
        if (!user) {
          return res.status(400).send({ message: 'User not found' });
        }
        user.foursquare = profile.id;
        user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
        user.save(function() {
          res.send({ 
            token: createToken(user),
            user: user
          });
        });
      });
    });
  },

  // Step 3b. Create a new user account or return an existing one.
  function (req, res, next) {
    var profile = req.profile;
    var filter = { or: [{ foursquare: profile.id }, { email: profile.email }] };

    User.find({ where: filter }, function(err, users) {
      var user = users[0];

      if (user) {
        if (!user.foursquare) {
          user.foursquare = profile.id;
          user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
          user.save(function() {
            req.user = user;
            next();
          });
          return;
        }
        req.user = user;
        next();
        return;
      }

      User.create({
        displayName: profile.firstName + ' ' + profile.lastName,
        foursquare: profile.id,
        email: profile.email,
        password: profile.id
      }, function (err, user) {
        req.user = user;
        next();
      });
    });
  }, sendAccessToken);

};