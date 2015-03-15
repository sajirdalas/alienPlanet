var main = require("./main");
var reddit = require("./reddit.js");

//First we test if the plugin correctly detects that a website has never been posted.
//We use the venezuela governemnt website for this because no one is ever going to post that
//Who saids tests had to be well done?

exports["testing non submited link (async)"] = function(assert, done) {
  reddit.checkIfOnReddit("gobiernoenlinea.gob.ve/home/homeG.dot",function(result){
  	var detected = result.detected;
  	var elements = result.posts;
  	assert.pass(!detected,"testing that a never posted website is recognized as so");
  	done();
  });
  
};

//Now we use a link that has been posted, check it has been detected and that there are posts out there for this

exports["testing submited link (async)"] = function(assert, done) {
  reddit.checkIfOnReddit("http://www.theverge.com/2015/3/6/8158805/apple-watch-macbook-announcement-rumors-news",function(result){
  	var detected = result.detected;
  	var elements = result.posts;
  	assert.pass(detected,"testing that a posted website is recognized as so");
  	assert.pass(elements.length,"testing that a posts are returned");
  	done();
  });
  
};
require("sdk/test").run(exports);
