chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.actionToDo) {
            case 'captureTab': {
                const capturing = browser.tabs.captureVisibleTab(sender.tab.windowId, {
                    'format': 'jpeg', 'quality': 10,
                    'rect': {
                        'x': 0,
                        'y': 0,
                        'width': request.width,
                        'height': request.height,
                    }
                });
                capturing.then(function (result) {
                    sendResponse(result);
                }, function (error) {
                    sendResponse(error);
                });
                return true;
            } break;
        }
    });