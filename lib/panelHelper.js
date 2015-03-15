var mainCode = require("./main.js");

//AUXILIARY FUNCTIONS

//There are 3 possible modes in the panel. Not detected, list and reddit. This functions are used to toggle between the three

function panelNotDetectedMode(panel, button, self, message){
	//message is an optional paramenter
	message = message || 0;

	resetPanel(panel, self, function(){
		if(message != 0){
			panel.port.emit("setNotFoundMessage",message);
		}
		panel.resize(200,200);
	});


}


function panelListMode(redditPost, panel, button, self){


	resetPanel(panel, self, function(){
		panel.port.emit("sendPosts",redditPost);
		panel.resize(350,300);
	});
}

function panelRedditMode(url, panel, button){

	panel.resize(500,700);

	//and set the url if it has not been set already
	if(panel.contentURL != url){
		panel.contentURL = url;
    }

    panel.resize(500,700);
}

//This is the one function that resets the panel to state 0

function resetPanel(panel, self, callback){
	//panel.contentURL is buggy and sucks. Don't use it, don't compare to anything
	if(panel.viewState == 2){
		panel.destroy();
		panel = mainCode.createNewPanel();

		//panel.contentURL = self.data.url("panel.html");

		panel.port.once("contentScriptReady",function(){
			callback();
		});
    }else{
    	clearList(panel,callback);
    }
}

function clearList(panel, callback){
	panel.port.emit("clearList",{});
	//when the panel is done reseting se send callback
	panel.port.once("clearReady",function(){
		callback();
	});
}

exports.panelNotDetectedMode = panelNotDetectedMode;
exports.panelListMode = panelListMode;
exports.panelRedditMode = panelRedditMode;