// Javascript for extension popup

function init() {
  // sends a message to the background script and saves option
  chrome.runtime.sendMessage({ type: 'whateverYouLike', checked: true });

  // listens for messages from background
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'whateverYouLike') {

    }
  });
}

document.addEventListener('DOMContentLoaded', init, false);
