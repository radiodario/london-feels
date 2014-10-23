var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cors = require('cors');
var Twitter = require('node-tweet-stream');
var sentiment = require('sentiment');

var winston = require('winston');

var cache = require('./lib/cache');

server.listen(process.env.PORT);


var secrets = {
  consumer_key: process.env.TW_CONSUMER_KEY,
  consumer_secret: process.env.TW_CONSUMER_SECRET,
  token: process.env.TW_TOKEN,
  token_secret: process.env.TW_TOKEN_SECRET
};


app.get('/latest', cors(), function (req, res, next) {
  cache.getLatestTweets(function (error, tweets) {
    if (error) {
      next();
    }

    var tweets = tweets.map(JSON.parse);

    res.send(tweets);
  });
});

app.use(express.static('static'))


// create the pipe
var pipe = new Twitter(secrets);

pipe.on('tweet', function(tweet) {

  if (!tweet.coordinates) {
    return;
  }

  // XXX use logger
  // console.log(tweet.user.name + ':');
  // console.log('\t' + tweet.text);
  // console.log(formatPlace(tweet));
  // console.log("sent:", sentiment(tweet.text).score);
  // console.log('----------------------------');

  console.log('tweet: processed');

  tweet.sentiment = sentiment(tweet.text);

  var slimTweet = {
    id: tweet.id,
    created_at: tweet.created_at,
    sentiment: sentiment(tweet.text),
    coordinates: tweet.coordinates,
    user: {
      name: tweet.user.name,
      screen_name: tweet.user.screen_name,
      profile_image_url: tweet.user.profile_image_url
    },
    text: tweet.text,
    place: {
      name: tweet.place.name
    }
  };

  cache.add(slimTweet);

  io.emit('tweet', tweet);

});


pipe.on('error', function (err) {
  console.log('oops', err);
});

var places = {
    // FFFUUU IT'S lon,lat,lon,lat sw-ne
  london : '-0.309677,51.386352,0.054245,51.612047',
  berlin : '13.344269,52.486125,13.480225,52.549219'

}

pipe.location(places.london);


// gets a point
function formatPlace(tweet) {

  var str = 'Place: '

  if (tweet.geo) {
    str += tweet.geo.coordinates.join(",") + " ";
  }

  str += " " + tweet.place.name;

  return str
}