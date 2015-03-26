function getAllURLVersions(url) {
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

console.log(getAllURLVersions("http://www.bbc.co.uk/news/world-europe-32030270?ns_mchannel=social&ns_campaign=bbc_breaking&ns_source=twitter&ns_linkname=news_central"));