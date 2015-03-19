//Given a url returns an object with two elements on a callback.
//The first is called detected and is true if the website has been posted on reddit and viceversa
//The second is called posts and is a json object of the posts with the link. This object is empty if there are none

function checkIfOnReddit(url, callback){
	console.log("checking if on reddit");
	var formatedUrl = encodeURIComponent(url);
	var requestUrl = "http://www.reddit.com/submit.json?url="+formatedUrl;
	httpGet(requestUrl, function(response){

			if(response.status == 0){
				var toReturn = {detected:false, posts:{}, checkedUrl: url, error:"network"};
			}
			else if(response.json=="{}"){
				//so this has NOT been posted on reddit or reddit is offline
				var toReturn = {detected:false, posts:{}, checkedUrl: url, error:"none"};
			}else{
				//is the response an array?
				if(typeof response.json.length === "undefined"){
					//This has only been posted ONCE
					var children = response.json.data.children
				}else{
					//The reddit api responds in weird ways depending if it has been posted once or several times
					var children = response.json[0].data.children
				}
				var toReturn = {detected:true, posts:children, checkedUrl: url, error:"none"};
			}
			callback(toReturn);
	});
}

//this functions simply get and url and executes a calback when answered

function httpGet(theUrl, callback){
	console.log("http get");
	var Request = require("sdk/request").Request;
	var redditRequest = Request({
		url: theUrl,
		onComplete: callback
	});
	redditRequest.get();
}

exports.checkIfOnReddit = checkIfOnReddit;

