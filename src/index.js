let scrollbar, screenshotView, lens, triggerZone, isDragging = false;
let hideOnMouseOverTimeout, mouseOverDebounceTimeout;

const configs = {
    'enabled': true,
    'width': 180,
    'triggerZoneWidth': 20,
}

document.documentElement.style.setProperty('--lens-scrollbar-width', `${configs.width}px`);
document.documentElement.style.setProperty('--lens-scrollbar-collapsed-width', `${configs.triggerZoneWidth}px`);

document.addEventListener('DOMContentLoaded', function () {
    if (configs.enabled) {
        addTriggerZone();
        addScrollbar();
        addLens();
        setMouseListeners();
    }
});

let captured = false;
// Define the height of each chunk to capture.
const CHUNK_HEIGHT = window.innerHeight; 

function capturePage() {
    // if (captured == true) return;
    captured = true;
    let pageHeight = document.body.scrollHeight;
    let chunksCount = 0;
    let currentY = 0;

    // chunksCount = Math.ceil(document.body.scrollHeight / CHUNK_HEIGHT);
    chunksCount = pageHeight / CHUNK_HEIGHT;
    document.documentElement.style.setProperty('--scroll-lense-img-chunk-height', `calc(100vh / ${chunksCount})`);

    /// clear previous screenshots
    const prevImages = scrollbar.querySelectorAll('img')
    prevImages.forEach(element => {
        element.remove();
    });
 
    function capturePagePart(){
        chrome.runtime.sendMessage({
            actionToDo: 'captureTab',
            width: window.innerWidth,
            height: CHUNK_HEIGHT,
            top: parseInt(currentY)
        }, (data) => {
            if (data == undefined) return;
            if (scrollbar) {
                // Create an img element for the captured chunk.
                const img = document.createElement('img');
                img.className = 'scrollbar-lense-screenshot-chunk';
                img.src = data;
    
                scrollbar.appendChild(img);
                currentY += CHUNK_HEIGHT;
    
                // Continue capturing until we reach the end of the page.
                if (currentY < pageHeight) {
                    capturePagePart();
                } else {
                    // All chunks captured
                    currentY = 0;
                    lens.style.height = `${window.innerHeight * (window.innerHeight / document.body.scrollHeight)}px`;
                }
            } 
        });
    }
    capturePagePart();
    
}

function addTriggerZone(){
    triggerZone = document.createElement('div');
    triggerZone.className = 'lens-scrollbar-trigger';
    document.body.appendChild(triggerZone);
}

function addScrollbar() {
    scrollbar = document.createElement('div');
    scrollbar.className = 'lens-scrollbar';
    // screenshotView = document.createElement('img');
    // scrollbar.appendChild(screenshotView);
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

function setLensOverlayPosition() {
    /// currentscroll / scrollheight = dy / windowheight
    const scrollbarHeight = scrollbar.clientHeight;
    lens.style.top = `${(window.scrollY * scrollbarHeight) / document.body.scrollHeight}px`;
}

function setMouseListeners() {
    window.addEventListener('scroll', ()=>{
        setLensOverlayPosition();
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

        document.addEventListener('mousemove', mouseMoveListener);
    });

    document.addEventListener('mouseup', ()=>{
        if (isDragging) {
            isDragging = false;
            document.removeEventListener('mousemove', mouseMoveListener);
        }
    });

    scrollbar.addEventListener('selectstart', e => e.preventDefault())

    scrollbar.addEventListener("dragstart", (e)=>{
        e.preventDefault();
    }, true);

    triggerZone.addEventListener("mouseenter", ()=>{
        clearTimeout(mouseOverDebounceTimeout);
        mouseOverDebounceTimeout = setTimeout(()=>{
            if (document.body.scrollHeight > (window.innerHeight * 2)) {
                capturePage();
                revealScrollbar();
            }
        }, 60)
        clearTimeout(hideOnMouseOverTimeout);
    });
    // triggerZone.addEventListener("mouseout", ()=>{
    //     clearTimeout(mouseOverDebounceTimeout);
    // });

    scrollbar.addEventListener("mouseout", ()=>{
        clearTimeout(hideOnMouseOverTimeout);
        hideOnMouseOverTimeout = setTimeout(()=>{
            if (bodyIsHovered == true) hideScrollbar();
        }, 150)
    })

    /// Check when cursor leaves browser window to keep lens revealed
    let bodyIsHovered = true;
    document.body.addEventListener('mouseover', ()=> bodyIsHovered = true)
    document.body.addEventListener('mouseout', ()=> bodyIsHovered = false)

    function mouseMoveListener(e) {
        if (isDragging) 
            window.scrollTo({
                top: (Math.round(e.clientY * document.body.scrollHeight) / window.innerHeight) - (window.innerHeight / 2),
                behavior: "instant"
            });
    }

    function revealScrollbar(){
        scrollbar.classList.add('revealed-lens-scrollbar')
    }
    function hideScrollbar(){
        scrollbar.classList.remove('revealed-lens-scrollbar');
    }
}