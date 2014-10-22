

var secrets = require('./secrets');

var Twitter = require('node-tweet-stream');
var sentiment = require('sentiment');


// create the pipe
var pipe = new Twitter(secrets);


pipe.on('tweet', function(tweet) {

  // debugger;
  console.log(tweet.user.name + ':');
  console.log('\t' + tweet.text);
  console.log(formatPlace(tweet));
  console.log("sent:", sentiment(tweet.text).score);
  console.log('----------------------------');

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