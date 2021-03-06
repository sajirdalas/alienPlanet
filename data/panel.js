//This is the script running inside of the panel.

console.log("panel script starting");

var defaultNotFoundMessage = "This link has not been posted on reddit";

window.onload = function(){
	if(document.URL.startsWith("http://www.reddit.com") || document.URL.startsWith("https://www.reddit.com")){
		//We need to add some custom buttons to reddit on the panel. If the reddit URL is detected panel.js is up for the job
		console.log("Panel Detects reddit. Adding buttons");
		var topBar = document.getElementById("topbar");
		var backButton = document.createElement("div");
		var redditButton = document.createElement("div");
		backButton.id = "customBackButton";
		redditButton.id = "customRedditButton";
		backButton.className = "customButton";
		redditButton.className = "customButton";
		backButton.textContent = "Back to List";
		redditButton.textContent = "Open in Reddit";
		backButton.onclick = goback;
		redditButton.onclick = openNewRedditTab;
		topBar.appendChild(backButton);
		topBar.appendChild(redditButton);

		//Also, prevent all links for working, opening them in new tabs
		var allLinks = document.getElementsByTagName("a");
		for (var i = 0; i < allLinks.length; i++) {
			allLinks[i].onclick = function(clickEvent){
				clickEvent.preventDefault();
				var clickedUrl = clickEvent.currentTarget.href;
				self.port.emit("newTab",{submit: false, url: clickedUrl});
			}
		};
	}else{
		//otherwise I cannot add onclick on the html that links to functions in panel.js, so I do it here
		console.log("Custom html detected, adding onclick functions");
		var subButtons = document.getElementsByClassName("submitButtons");
		//Why is this a loop? I probably planned to add several submit buttons
		for (var i = 0; i < subButtons.length; i++) {
			subButtons[i].onclick=openSubmit;
		};
	}
}

self.port.on("sendPosts",function(payload){
	console.log("panel received message, checking");
	//we get the results of the reddit check and we check AGAIN if it has been detected.
	if(payload.detected){
		//we need to change the html and hide the "not found message"
		var notFoundPanel = document.getElementById("notDetectedWrapper");
		notFoundPanel.classList.add("hidden");
		//notFoundPanel.className = "wrapper hidden";
		//and show the new pannel
		var foundPanel = document.getElementById("detectedWrapper");
		foundPanel.classList.remove("hidden");
		//foundPanel.className = "wrapper";
		var loadingPanel = document.getElementById("loadingWrapper");
		loadingPanel.classList.add("hidden");
		//iterate trough the reddit posts and add them to the list
		for (var i = 0; i < payload.posts.length; i++) {
			var currentPost = payload.posts[i].data;
			var numOfComment = currentPost.num_comments;
			//if(numOfComment > 0){
				var postTitle = currentPost.title;
				var postUrl = "http://www.reddit.com" + currentPost.permalink;
				var postSub = "/r/"+currentPost.subreddit;
				addListElement(postTitle,postUrl,postSub,numOfComment);
			//}
		}
	}else{
		//do nothing for now =)
	}
});

self.port.on("clearList",function(payload){
	console.log("panel clearing list");
	//We need to remove all visible elements in the list
	//var listElements = document.getElementsByClassName("listElement");
	//Now here is crazy thing, getElementsByClassName returns an active list. Meaning that is we remove a child with this class THE ARRAY LOSES AND ELEMENT
	//Ergo, we can not simply iterate through it and delete stuff because length CHANGES AND BREAKES THE LOOP
	//WHERE THE FUCK IS THIS DOCUMENTED

	//This is me working around this issue
	var activeListEelements = document.getElementsByClassName("listElement");
	var listElements = [];
	for (var i = 0; i < activeListEelements.length; i++) {
		listElements.push(activeListEelements[i]);
	};

	var listParent = document.getElementById("theList");
	for (var i = 0; i < listElements.length; i++) {
		listParent.removeChild(listElements[i]);
	};
	//and then reset the panel to its original state
	var notFoundPanel = document.getElementById("notDetectedWrapper");
	notFoundPanel.classList.remove("hidden");
	//notFoundPanel.className = "wrapper";
	//and hide the new pannel
	var foundPanel = document.getElementById("detectedWrapper");
	foundPanel.classList.add("hidden");
	//foundPanel.className = "wrapper hidden";
	var loadingPanel = document.getElementById("loadingWrapper");
	loadingPanel.classList.add("hidden");

	document.getElementById("notFoundMessage").textContent = defaultNotFoundMessage;

	var button = document.getElementById("submitButton1");
	button.classList.remove("hidden");

	self.port.emit("clearReady",{});
})

self.port.on("setNotFoundMessage",function(payload){
	var messageArea = document.getElementById("notFoundMessage");
	messageArea.textContent = payload;
	var button = document.getElementById("submitButton1");
	button.classList.add("hidden");
	console.log(button.className);
});

//Show or hide the loading screen

self.port.on("loadingScreen",function(state){
	//get all the panels
	console.log("working with loading screen");
	var notFoundPanel = document.getElementById("notDetectedWrapper");
	var foundPanel = document.getElementById("detectedWrapper");
	var loadingPanel = document.getElementById("loadingWrapper");

	if(state){
		//It is loading. Hide everything but the loading wrapper
		notFoundPanel.classList.add("hidden");
		foundPanel.classList.add("hidden");
		loadingPanel.classList.remove("hidden");
	}else{
		//done loading, hide the loading screen
		loadingPanel.classList.add("hidden");
	}
});

function addListElement(title, url, sub, commentNum){
	console.log("add list element");
	var referenceLi = document.getElementsByClassName("reference")[0];

	var newLi = referenceLi.cloneNode(true);
	newLi.className = "listElement";
	var firstLink = newLi.childNodes[0];
	var lastLink = newLi.childNodes[2];
	var commentCount = newLi.childNodes[4];
	//firstLink.href = url+".compact";
	firstLink.id = url+".compact";
	firstLink.href = url;
	lastLink.textContent = sub
	firstLink.textContent = title
	//lastLink.href = "http://www.reddit.com"+sub+"/.compact";
	lastLink.id = "http://www.reddit.com"+sub+"/.compact";
	lastLink.href = "http://www.reddit.com"+sub;
	lastLink.textContent = sub;

	commentCount.textContent = commentNum;

	//The shit I do for the sake of detail
	if(commentNum == 1){
		//This is just to remove an s if there is one comment
		newLi.childNodes[5].textContent = " comment";
	}

	firstLink.onclick = requestRedditMode;
	lastLink.onclick = function(clickEvent){
		clickEvent.preventDefault();
		self.port.emit("newTab",{submit: false, url: clickEvent.currentTarget.href});
	}

	document.getElementsByTagName("ul")[0].appendChild(newLi);
}

function requestRedditMode(clickEvent){
	console.log("requesting reddit mode");
	clickEvent.preventDefault();

	//show loading screen
	var notFoundPanel = document.getElementById("notDetectedWrapper");
	var foundPanel = document.getElementById("detectedWrapper");
	var loadingPanel = document.getElementById("loadingWrapper");
	notFoundPanel.classList.add("hidden");
	foundPanel.classList.add("hidden");
	loadingPanel.classList.remove("hidden");
	//we tell the main script to resize the panel for mobile reddit

	//var url = clickEvent.currentTarget.href;
	var url = clickEvent.currentTarget.id;
	self.port.emit("redditMode",url);
}

function goback(){
	self.port.emit("goBack",{});
}

function openNewRedditTab(){
	self.port.emit("newTab",{submit: false, url: document.URL.replace("/.compact",'')});
}

function openSubmit(){
	self.port.emit("newTab",{submit: true, url: ""});
}

console.log("panel Script Ready");
self.port.emit("contentScriptReady",{});