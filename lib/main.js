//needed variables from the sdk and modules

var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var reddit = require("./reddit");
var panelHelper = require("./panelHelper");

//This is the map that keeps track of the state of the panel on every tab. For more info check github documentation

tabMap = new Object();

//SET UP THE BUTTON IN THE ADDON BAR

var button = ToggleButton({
  id: "alienPlanetButton",
  label: "alienPlanet ready to take off",
  icon: {
    "16": "./16-grey_alien.png",
    "32": "./32-grey_alien.png",
    "64": "./64-grey_alien.png"
  },
  onChange: handleChange
});

//On change button that will show the pannel

function handleChange(state) {
  console.log("handle change");
  if (state.checked) {
    var currentTab = tabs.activeTab;
    var currentPanel = tabMap[currentTab.id];

    //wait? Is the panel out of date? Is this bug https://bugzilla.mozilla.org/show_bug.cgi?id=1147875 ? //Lets check
    if(currentTab.url != currentPanel.lastURL){
      //The bug is doing its thing. Update the panel
      changePanel(currentTab);
    }

    currentPanel.show({
      position: button
    });
  }
}


//function that unchecks the button when a panel is minimized

function handleHide() {
  console.log("handle hide");
  button.state('window', {checked: false});
}

//put all current tabs into the panel map

for (var i = 0; i < tabs.length; i++){

  //TODO add first open
  var tab = tabs[i];
  var newPanel = createNewPanel(200, 200);
  tabMap[tab.id] = newPanel;
  tabMap[tab.id].lastURL = "";
  tabMap[tab.id].viewState = 0;
  tabMap[tab.id].redditPosts = reddit.getEmpyRedditPostsObject("");
  changePanel(tab);
}

//SET UP TABS AND ITS LISTENERS

tabs.on('open', function(tab){
  //create new panel and add it to the map
  var newPanel = createNewPanel(200, 200);
  tabMap[tab.id] = newPanel;
  tabMap[tab.id].lastURL = "";
  tabMap[tab.id].viewState = 0;
  tabMap[tab.id].redditPosts = reddit.getEmpyRedditPostsObject("");
  updateIcon(tabMap[tab.id].redditPosts, button);
});

//This is the part that sends links to be checked every time a new page is loaded
//The ready event is fired everytime a tab Has loaded its DOM

tabs.on("ready", function(tab){
  console.log("ready");
  changePanel(tab);
});


tabs.on("pageshow", function(tab){
  console.log("pageshow");
  if(tab.url != tabMap[tab.id].lastURL){
    //The point of this is that most of the time ready fires and then pageshow. But sometimes only one.
    //This is here to prevent both from firing for the same URL
    changePanel(tab);
  }
});

function changePanel(tab){
  console.log("change panel");
  updateIcon(reddit.getEmpyRedditPostsObject(""), button);
  tabMap[tab.id].lastURL = tab.url;
  var currentTab = tab;
  var currentPanel = tabMap[tab.id];

  //If the user is browsing reddit we should not check anything and change to state 0 (not found) with a sligthly diferent message

  if(tab.url.startsWith("http://www.reddit.com") || tab.url.startsWith("https://www.reddit.com")){
    //User is on reddit. Way to go
    var youAreOnRedditMessage = "You are currently on reddit";
    panelHelper.panelNotDetectedMode(currentPanel, button, self, youAreOnRedditMessage, function(newPanel){
        //ADD NEW PANEL PASS
        tabMap[tab.id] = newPanel;
        tabMap[tab.id].viewState = 0;
        tabMap[tab.id].redditPosts = reddit.getEmpyRedditPostsObject("");
    });
    updateIcon(reddit.getEmpyRedditPostsObject(""), button);
  }
  else{
  //and check if it is on reddit and send the results to the panel script
  reddit.checkIfOnReddit(tab.url,function(result){

    //before updating shit we need to make sure the results we are receiving are from the current url
    //fucking javascript and its asyncronizity


    if(tabMap[tab.id].lastURL == result.checkedUrl){
        tabMap[tab.id].redditPosts = result;
        //well then, update the apropiate panel accordingly
        if(result.detected){
          //console.log("Posted. Sending reddit posts to panel.js");
          panelHelper.panelListMode(result, currentPanel, button, self, function(newPanel){
            tabMap[tab.id] = newPanel;
            tabMap[tab.id].viewState = 1;
          });
          updateIcon(result, button);
        }else{
            //console.log("not posted on reddit");
            //Not on reddit or reddit offline
            if(result.error == "network"){
              var notFoundMessage = "Internet error";
            }else{
              var notFoundMessage = 0;
            }
            updateIcon(result, button);
            panelHelper.panelNotDetectedMode(currentPanel, button, self, notFoundMessage,function(newPanel){
              tabMap[tab.id] = newPanel;
            });
          }
      
    }else{
      //What? Is something supposed to go here?
    }
  });

  }
}

tabs.on("activate",function(tab){
  console.log("activate");
  updateIcon(tabMap[tab.id].redditPosts, button);
});


function createNewPanel(width, height){
  console.log("create new panel");
  var panel = panels.Panel({
    width: width,
    height: height,
    contentURL: self.data.url("panel.html"),
    //contentURL: "http://google.com",
    onHide: handleHide,
    contentScriptFile: self.data.url("panel.js"),
    contentStyleFile: self.data.url("reddit.css"),
    contextMenu: true
  });

  //This guy is listening for messages from the panel to go into reddit mode

  panel.port.on("redditMode",function(url){
    var tab = tabs.activeTab;
    var currentPanel = tabMap[tab.id];
    panelHelper.panelRedditMode(url, currentPanel, button);
    currentPanel.viewState = 2;
  });

  //This guy is listening for messages from the back button to go back from reddit mode

  panel.port.on("goBack",function(){
    var tab = tabs.activeTab;
    var currentPanel = tabMap[tab.id];
    panelHelper.panelListMode(currentPanel.redditPosts, currentPanel, button, self, function(newPanel){
        tabMap[tab.id] = newPanel;
        tabMap[tab.id].viewState = 1;
        button.state('tab', {checked: true});
        newPanel.show({
          position: button
        });
    });
  });

  //This guy is listening for messages from the button that opens up a new tab on reddit

  panel.port.on("newTab",function(payload){
    if(payload.submit){
      var currentURL = encodeURIComponent(tabs.activeTab.url);
      var openURL = "http://www.reddit.com/submit?url="+currentURL;
    }
    else{
      var openURL = payload.url
    }
    tabs.open(openURL);
    panel.hide();
  });

  return panel;
}

function updateIcon(redditResult, button) {
  console.log("update icon");
  //reddit result is the object that comes from reddit.js with all its data

  //We set a variable with the color for the alien icon to be, then use it in the object that determines the state of the button.
  //This is probably the crappiest way possible to do this. Good job.

  if(redditResult.detected){

    var color = "blue";
    var badgeText = redditResult.posts.length;

  }else{

    var color = "grey";
    var badgeText = "";

  }

  var buttonObject = {
    icon: {
      "16": "./16-"+color+"_alien.png",
      "32": "./32-"+color+"_alien.png",
      "64": "./64-"+color+"_alien.png"
    },
    badge: badgeText
  };

  button.state("tab", buttonObject);


}

exports.createNewPanel = createNewPanel;
