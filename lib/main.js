//needed variables from the sdk and modules

var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require("sdk/tabs");
var reddit = require("./reddit.js");
var panelHelper = require("./panelHelper.js");

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

  if (state.checked) {

    var currentTab = tabs.activeTab;
    var currentPanel = tabMap[currentTab.id];
    currentPanel.show({
      position: button
    });
  }
}


//function that unchecks the button when a panel is minimized

function handleHide() {
  button.state('window', {checked: false});
}

//put all current tabs into the panel map

for (var i = 0; i < tabs.length; i++){

  //TODO add first open
  var tab = tabs[i];
  var newPanel = createNewPanel(200, 200);
  tabMap[tab.id] = newPanel;
  changePanel(tab);
}

//SET UP TABS AND ITS LISTENERS

tabs.on('open', function(tab){
  //create new panel and add it to the map
  var newPanel = createNewPanel(200, 200);
  tabMap[tab.id] = newPanel;
  tabMap[tab.id].lastURL = "";
  tabMap[tab.id].buttonState = false;
  tabMap[tab.id].viewState = 0;
  updateIcon(false, button);
});

//This is the part that sends links to be checked every time a new page is loaded
//The ready event is fired everytime a tab Has loaded its DOM

//tabs.on("ready", changePanel(tab));
//tabs.on("pageshow", changePanel(tab));

tabs.on("pageshow", function(tab){
  console.log("pageshow");
  changePanel(tab);
});

function changePanel(tab){
  updateIcon(false, button);
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
    });
    tabMap[tab.id].buttonState = false;
    updateIcon(false, button);
  }
  else{
  //and check if it is on reddit and send the results to the panel script
  reddit.checkIfOnReddit(tab.url,function(result){

    //before updating shit we need to make sure the results we are receiving are from the current url
    //fucking javascript and its asyncronizity


    if(tabMap[tab.id].lastURL == result.checkedUrl){

        //well then, update the apropiate panel accordingly
        if(result.detected){
          //console.log("Posted. Sending reddit posts to panel.js");
          panelHelper.panelListMode(result, currentPanel, button, self, function(newPanel){
            tabMap[tab.id] = newPanel;
            tabMap[tab.id].viewState = 1;
          });
          tabMap[tab.id].buttonState = true;
          updateIcon(true, button);
        }else{
            //console.log("not posted on reddit");
            //Not on reddit or reddit offline
            if(result.error == "network"){
              var notFoundMessage = "Internet error";
            }else{
              var notFoundMessage = 0;
            }
            tabMap[tab.id].buttonState = false;
            updateIcon(false, button);
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
  updateIcon(tabMap[tab.id].buttonState, button);
});


function createNewPanel(width, height){
  var panel = panels.Panel({
  width: width,
  height: height,
  contentURL: self.data.url("panel.html"),
  onHide: handleHide,
  contentScriptFile: self.data.url("panel.js")
  });

  //This guy is listening for messages from the panel to go into reddit mode

  panel.port.on("redditMode",function(url){
    var currentTab = tabs.activeTab;
    var currentPanel = tabMap[currentTab.id];
    panelHelper.panelRedditMode(url, currentPanel, button);
    currentPanel.viewState = 2;
  });

  return panel;
}

function updateIcon(detected, button) {

  //We set a variable with the color for the alien icon to be, then use it in the object that determines the state of the button.
  //This is probably the crappiest way possible to do this. Good job.

  if(detected){

    color = "blue";

  }else{

    color = "grey";

  }

  var buttonObject = {
    icon: {
      "16": "./16-"+color+"_alien.png",
      "32": "./32-"+color+"_alien.png",
      "64": "./64-"+color+"_alien.png"
    }
  };

  button.state("tab", buttonObject);


}

exports.createNewPanel = createNewPanel;
