//Given a url returns an object with two elements on a callback.
//The first is called detected and is true if the website has been posted on reddit and viceversa
//The second is called posts and is a json object of the posts with the link. This object is empty if there are none

function checkIfOnReddit(url, callback){
	console.log("checking if on reddit");
	var checkUrlList = getAllURLVersions(url);
	var checkedCounter = 0;
	var resultArray = [];

	for (var i = 0; i < checkUrlList.length; i++) {

		//Every version of the url is sent async for checking with a callback for the results

		httpGet(checkUrlList[i], function(response){

			//every result is checked and creates its own result object. All results objects are put unto a common result array

			if(response.status == 0){
				var resultObj = {detected:false, posts:[], checkedUrl: url, error:"network"};
			}
			else if(response.json=="{}" || response.json.data.children.length == 0){
				//so this has NOT been posted on reddit or reddit is offline
				var resultObj = {detected:false, posts:[], checkedUrl: url, error:"none"};
			}else{
				//is the response an array?
				if(typeof response.json.length === "undefined"){
					var children = response.json.data.children
				}else{
					//The reddit api responds in weird ways sometimes
					var children = response.json[0].data.children
				}
				var resultObj = {detected:true, posts:children, checkedUrl: url, error:"none"};
			}

			resultArray.push(resultObj);

			checkedCounter++;

			//If the counter has reached the number of elements it means all async checks have been done. The result array now contains all the results from the check
			if(checkedCounter == checkUrlList.length){
				//Put all the results together and send them down the line;
				var finalDetected = false;
				var finalChildren = [];
				var finalError = "none";
				for (var x = 0; x < resultArray.length; x++) {
					//if there was a network error break the loop
					if(resultArray[x].error  == "network"){
						finalDetected = false;
						finalError = "network";
						finalChildren = [];
						break;
					}
					if(resultArray[x].detected){
						finalDetected = true;
						finalChildren = finalChildren.concat(resultArray[x].posts);
					}
				}
				//This final object represents the results of all checks
				var finalResult = {detected: finalDetected, posts: finalChildren, checkedUrl: url, error: finalError};
				callback(finalResult);
			}


		});
	}
	
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

function getAllURLVersions(url) {
	//The url could have several alternative version, this function that I blatantly borrowed from the Reddit Submission Finder source code generates several possible reddit links to check for results
	var host = url.split("/")[2];
	var result = [];
	if ((host === 'youtube.com' || host === 'www.youtube.com') && url.split("/")[3].indexOf('watch?') === 0) {
		youtubeID = function () {
			var query = url.substring(url.indexOf('?') + 1);
			var parameters = query.split('&');
			for (var i = 0; i < parameters.length; i++) {
				var pair = parameters[i].split('=');
				if (pair[0] === 'v') {
					return pair[1];
				}
			}
			return '';
		}();
		result.push('http://api.reddit.com/search.json?q=' + encodeURIComponent('(url:' + youtubeID + ') (site:youtube.com OR site:youtu.be)'))
	} else {
		var without_http = "";
		if (url.slice(-1) === "/") {
			url = url.substring(0, url.length - 1);
		}
		result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent(url));
		result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent(url + "/"));
		if (url.indexOf('https') === 0) {
			without_http = url.substring(8);
			result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent(without_http));
			result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent(without_http + "/"));
		} else {
			if (url.indexOf('http') === 0) {
				without_http = url.substring(7);
				result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent("https://" + without_http));
				result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent("https://" + without_http + "/"));
			} else {
				without_http = url;
				result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent("https://" + without_http));
				result.push('http://www.reddit.com/api/info.json?url=' + encodeURIComponent("https://" + without_http + "/"));
			}
		}
	}
	return result;
}

function getEmpyRedditPostsObject(){
	return {detected:false, posts:[], checkedUrl: "", error:"none"};
}

exports.checkIfOnReddit = checkIfOnReddit;
exports.getEmpyRedditPostsObject = getEmpyRedditPostsObject;

