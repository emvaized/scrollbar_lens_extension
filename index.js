let isShown, scrollbar, screenshotView, lens, triggerZone, isDragging = false, magnifier;
const zoom = 2.5;

const configs = {
    'enabled': true,
    'width': 180,
    'triggerWidth': 10,
}

document.documentElement.style.setProperty('--lens-scrollbar-width', `${configs.width}px`);
document.documentElement.style.setProperty('--lens-scrollbar-collapsed-width', `${configs.triggerWidth}px`);

document.addEventListener('DOMContentLoaded', function () {
    if (configs.enabled && document.body.scrollHeight / window.innerHeight > 2) {
        addTriggerZone();
        addScrollbar();
        addLens();
        addMagnifier();
        setMouseListeners();
    }
});

let captured = false;
function capturePage() {
    // if (captured == true) return;
    captured = true;

    chrome.runtime.sendMessage({
        actionToDo: 'captureTab',
        // height: document.documentElement.scrollHeight ?? document.body.scrollHeight,
        height: document.body.scrollHeight,
        width: window.innerWidth,
    }, (data) => {
        if (data == undefined) return;
        if (screenshotView) {
            screenshotView.src = data;
            lens.style.height = `${window.innerHeight * (window.innerHeight / document.body.scrollHeight)}px`;
        } 

        if (magnifier){
            magnifier.style.backgroundImage = 'url("' + data + '")';

        }
    });
}

function addTriggerZone(){
    triggerZone = document.createElement('div');
    triggerZone.className = 'lens-scrollbar-trigger';
    document.body.appendChild(triggerZone);
}

function addScrollbar() {
    scrollbar = document.createElement('div');
    scrollbar.className = 'lens-scrollbar';
    screenshotView = document.createElement('img');
    scrollbar.appendChild(screenshotView);
    document.body.appendChild(scrollbar);
    setScrollbarClickListener();
}


function addLens() {
    lens = document.createElement('div');
    lens.className = 'lens-overlay';

    lens.style.height = `${window.innerHeight * (window.innerHeight / document.body.scrollHeight)}px`;
    setLensOverlayPosition();
    scrollbar.appendChild(lens);
}

function addMagnifier(){
    magnifier = document.createElement('div');
    magnifier.className = 'lens-magnifier';
    const percentRelativeToParent = 100 * zoom;
    magnifier.style = 
    `
    border:1px solid lightgray;border-radius:4px;position:absolute;height:${percentRelativeToParent}%;width:${percentRelativeToParent}%;top:0;left:-${percentRelativeToParent}%;z-index:98932380293802;margin-left:-10px;background-repeat:no-repeat;background-size:cover;box-shadow:1px 3px 3px rgba(0,0,0,0.2);
    `;
    lens.appendChild(magnifier);
}

function setLensOverlayPosition() {
    /// currentscroll / scrollheight = dy / windowheight
    const scrollbarHeight = scrollbar.clientHeight;
    lens.style.top = `${(window.scrollY * scrollbarHeight) / document.body.scrollHeight}px`;
}

function setMouseListeners() {
    window.addEventListener('scroll', ()=>{
        if (isShown) setLensOverlayPosition();
    }, true);
}

function setScrollbarClickListener() {
    scrollbar.addEventListener('mousedown', (e)=>{
        isDragging = true;
        const scrollbarHeight = scrollbar.clientHeight;
        window.scrollTo({
            top: (Math.round(e.clientY * document.body.scrollHeight) / scrollbarHeight) - (window.innerHeight / 2),
            behavior: "smooth"
        });

    });

    document.addEventListener('mouseup', ()=>{
        if (isDragging) {
            isDragging = false;
        }
    });

    scrollbar.addEventListener('mousemove', mouseMoveListener);

    scrollbar.addEventListener("dragstart", (e)=>{
        e.preventDefault();
    }, true);

    let hideOnMouseOverTimeout, mouseOverDebounceTimeout;

    triggerZone.addEventListener("mouseenter", ()=>{
        clearTimeout(mouseOverDebounceTimeout);
        mouseOverDebounceTimeout = setTimeout(()=>{
            capturePage();
            revealScrollbar();
        }, 100)
        clearTimeout(hideOnMouseOverTimeout);
    });

    scrollbar.addEventListener("mouseout", ()=>{
        clearTimeout(hideOnMouseOverTimeout);
        hideOnMouseOverTimeout = setTimeout(()=>{
            if (bodyIsHovered == true) hideScrollbar();
        }, 100)
    })

    /// Check when cursor leaves browser window to keep lens revealed
    let bodyIsHovered = true;
    document.body.addEventListener('mouseover', ()=>{
        bodyIsHovered = true;
    })
    document.body.addEventListener('mouseout', ()=>{
        bodyIsHovered = false;
    })

    function mouseMoveListener(e) {
        console.log('mousemove')
        if (isDragging) {
            window.scrollTo({
                top: (Math.round(e.clientY * document.body.scrollHeight) / window.innerHeight) - (window.innerHeight / 2),
                behavior: "instant"
            });
        }
            

        if (magnifier){
            const dy = (e.clientY * scrollbar.clientHeight) / window.innerHeight;
            magnifier.style.backgroundPositionY = 
                //  "0px -" + ((dx * zoom) - h + bw) + "px";
                //  "-" + (dy * zoom) + "px";
                 "-" + (dy) + "px";

            // magnifier.style.top = (dy) + "px";
        }
    }

    function revealScrollbar(){
        isShown = true;
        scrollbar.classList.add('revealed-lens-scrollbar')
    }
    function hideScrollbar(){
        isShown = false;
        scrollbar.classList.remove('revealed-lens-scrollbar');
    }
}