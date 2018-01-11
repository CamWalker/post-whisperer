// The content script has access to the DOM's of the user's tabs/current page

// Listens for message from background script.
chrome.runtime.onMessage.addListener(function(msg, sender, cb) {
  if (msg.type === 'whateverYouLike') {
    // sends a message to background script
    chrome.runtime.sendMessage({ type: 'whateverYouLike', object: 'no' });
  }
});
