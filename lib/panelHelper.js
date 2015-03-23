var mainCode = require("./main");

//AUXILIARY FUNCTIONS

//There are 3 possible modes in the panel. Not detected, list and reddit. This functions are used to toggle between the three

function panelNotDetectedMode(panel, button, self, message, callback){
	console.log("not detected mode");

	//message is an optional paramenter
	message = message || 0;

	resetPanel(panel, 200, 200, self, function(newPanel){
		if(message != 0){
			newPanel.port.emit("setNotFoundMessage",message);
		}
		callback(newPanel);
	});


}


function panelListMode(redditPost, panel, button, self, callback){
	console.log("list mode");

	resetPanel(panel, 350, 300, self, function(newPanel){
		newPanel.port.emit("sendPosts",redditPost);
		callback(newPanel);
	});
}

function panelRedditMode(url, panel, button){
	console.log("reddit mode");

	//and set the url if it has not been set already
	if(panel.contentURL != url){
		panel.contentURL = url;
    }

    panel.resize(500,700);
}

//This is the one function that resets the panel to state 0

function resetPanel(panel, width, height, self, callback){
	console.log("reset panel");
	//panel.contentURL is buggy and sucks. Don't use it, don't compare to anything
	if(panel.viewState == 2){

  		var lastURL = panel.lastURL;
  		var buttonState = panel.buttonState;
		panel.destroy();
		var newPanel = mainCode.createNewPanel(width, height);
		newPanel.lastURL = lastURL;
		newPanel.buttonState = buttonState;
		newPanel.viewState = 0;

		callback(newPanel);


		//panel.contentURL = self.data.url("panel.html");
		//panel.port.on("contentScriptReady", function(){
      	//	callback();
    	//});

    }else{
    	clearList(panel,function(){
    		panel.resize(width, height);
    		callback(panel);
    	});
    }
}

function clearList(panel, callback){
	console.log("clear lists");
	panel.port.emit("clearList",{});
	//when the panel is done reseting se send callback
	panel.port.once("clearReady",function(){
		callback();
	});
}

exports.panelNotDetectedMode = panelNotDetectedMode;
exports.panelListMode = panelListMode;
exports.panelRedditMode = panelRedditMode;