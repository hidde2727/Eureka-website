const offsetX = 1000;;
const offsetY = 0;

const amountCircles = 15;
const leftColorSpectrum = 0x546187;
const rightColorSpectrum = 0x3F4F75;
const minVelocity = 1;
const maxVelocity = 6;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getOneOrNegativeOne() {
    return Math.random() > 0.5 ? 1 : -1;
}

function getRandomColorFromRange(left, right) {
    var rand = Math.random();

    var red = ((left & 0xFF0000) >> 16) * rand + ((right & 0xFF0000) >> 16) * (1 - rand);
    var green = ((left & 0x00FF00) >> 8) * rand + ((right & 0x00FF00) >> 8) * (1 - rand);
    var blue = (left & 0x0000FF) * rand + (right & 0x0000FF) * (1 - rand);

    var finalColor = (Math.floor(red) << 16) | (Math.floor(green) << 8) | Math.floor(blue);
    return finalColor;
}

function regenerateCircle(circle, clampToEdge) {
    var background = document.getElementById("background");

    if(clampToEdge) {
        var rand = Math.random();
        if(rand < 0.25) { // Top edge
            circle.x = getRandomInt(0, background.clientWidth);
            circle.y = -circle.clientHeight;
            circle.xVel = getRandomInt(minVelocity, maxVelocity) * 1;
            circle.yVel = getRandomInt(minVelocity, maxVelocity) * getOneOrNegativeOne();
        } else if(rand < 0.5) { // Bottom edge
            circle.x = getRandomInt(0, background.clientWidth);
            circle.y = background.clientHeight + circle.clientHeight;
            circle.xVel = getRandomInt(minVelocity, maxVelocity) * -1;
            circle.yVel = getRandomInt(minVelocity, maxVelocity) * getOneOrNegativeOne();
        } else if(rand < 0.75) { // Left edge
            circle.x = -circle.clientWidth;
            circle.y = getRandomInt(0, background.clientHeight);
            circle.xVel = getRandomInt(minVelocity, maxVelocity) * getOneOrNegativeOne();
            circle.yVel = getRandomInt(minVelocity, maxVelocity) * -1;
        } else { // Right edge
            circle.x = (background.clientWidth + circle.clientWidth);
            circle.y = getRandomInt(0, background.clientHeight);
            circle.xVel = getRandomInt(minVelocity, maxVelocity) * getOneOrNegativeOne();
            circle.yVel = getRandomInt(minVelocity, maxVelocity) * 1;
        }
    } else {
        circle.x = getRandomInt(0, background.clientWidth);
        circle.y = getRandomInt(0, background.clientHeight);

        circle.xVel = getRandomInt(minVelocity, maxVelocity) * getOneOrNegativeOne();
        circle.yVel = getRandomInt(minVelocity, maxVelocity) * getOneOrNegativeOne();
    }

    circle.style.top = (circle.y + offsetY) + "px";
    circle.style.left = (circle.x + offsetX) + "px";

    circle.style.color = "#" + getRandomColorFromRange(leftColorSpectrum, rightColorSpectrum).toString(16);
}

function spawnCircle() {
    var background = document.getElementById("background");

    var circle = document.createElement("span");
    circle.className = "background-circle";
    regenerateCircle(circle, false);

    background.appendChild(circle);
}

var previousFrameTime = performance.now();
function onNextFrame(timeStamp) {
    var background = document.getElementById("background");
    var circles = background.getElementsByClassName("background-circle");

    var timePassed = 1 / ((timeStamp - previousFrameTime));
    previousFrameTime = timeStamp;

    for(var i = 0; i < circles.length; i++) {
        var circle = circles[i];

        circle.x = circle.x + circle.xVel * timePassed;
        circle.y = circle.y + circle.yVel * timePassed;

        circle.style.top = (circle.y + offsetY) + "px";
        circle.style.left = (circle.x + offsetX) + "px";

        if(circle.x < -circle.clientWidth || circle.x > background.clientWidth + circle.clientWidth
            || circle.y < -circle.clientHeight || circle.y > background.clientHeight + circle.clientHeight) 
        {
            regenerateCircle(circle, true);
        }
    }

    requestAnimationFrame(onNextFrame);
}

function onWindowInit() {
    for (var i = 0; i < amountCircles; i++) {
        // Add a circle
        spawnCircle();
    }
}

addEventListener("load", onWindowInit);
requestAnimationFrame(onNextFrame);