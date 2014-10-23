// this keeps the last 10 minutes of tweets

var redis = require('redis');
var url = require('url');
if (process.env.ENV == 'dev') {
  var client = redis.createClient();

} else {
  var redisURL = url.parse(process.env.REDISButt_URL);
  var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
  client.auth(redisURL.auth.split(":")[1]);

}



client.on('error', console.log);

function now() {
  return Math.round(new Date().getTime() / 1000);
}

// store in 5 min intervals
var step = 60*5;

// returns what 10 minute group this tweet belongs to
function dateToTimeGroup() {
  var current_time = now();

  var timeGroup = current_time - (current_time % step)
  return timeGroup;
}



function addTweet(tweet) {

  var timeGroup = dateToTimeGroup();
  var key = "tweets_" + timeGroup;

  client.sadd(key, JSON.stringify(tweet));

}


function getLatestTweets(callback) {

  client.smembers("tweets", callback);

}


function updateLatestTweets() {

  var latest = dateToTimeGroup();

  var index = "tweets_"+latest;
  var t_minus_one_index = "tweets_"+(latest-step);

  client.sunionstore("tweets", index, t_minus_one_index);

  client.expire("tweets", 30);

  console.log('updated tweets');

}


function deleteOldKeys() {

  var timeGroup = dateToTimeGroup();

  var oldkey = "tweets_" + (timeGroup - (step*3));

  console.log('deleting old tweet index:', oldkey);

  client.del(oldkey, redis.print);

}

module.exports = {
  deleteInterval: setInterval(deleteOldKeys, step*1000), // delete oldest every 5 minutes
  updateInterval: setInterval(updateLatestTweets, 5*1000), // update the latest tweets every 30 seconds
  getLatestTweets: getLatestTweets,
  add: addTweet
}
