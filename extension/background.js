// The background script is always running when the chrome extension is enabled


// access to all tabs
chrome.tabs.query({}, function(tabs) {
  var msgObj = {};
  tabs.forEach(function(tab) {
    // send message to content script (each tab's DOM)
    chrome.tabs.sendMessage(tab.id, msgObj, function(res) {});
  });
});

// if using local storage, use below:
// chrome.storage.sync.get({ checked: false }, cb);

// listens for messages from popup or content script
chrome.runtime.onMessage.addListener(function(request) {
  if (request.type === 'whateverYouLike') {

  }
});

// listens for a new tab being opened
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {

  }
})

// Listens for commands if you have them example - ctrl + s.
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'whateverIsDefinedInManifest') {
    // send message
    chrome.runtime.sendMessage({ type: 'whateverYouLike' });
  }
});
