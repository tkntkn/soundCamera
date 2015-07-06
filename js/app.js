const WINDOW_SIZE = 16;
 
var canvas = document.querySelector("#canvas");
var video = document.querySelector("#preview");
var log = document.querySelector("#log");
var context;
var oscillator;
var gainNode;
var filter;
 
var ctx = canvas.getContext("2d");

var position = {x:0, y:0};
var topLeft = {x:0, y:0};
var colors = [];
 
function setPosition(event){
	position.x = event.layerX - canvas.offsetLeft;
	position.y = event.layerY - canvas.offsetTop;
	topLeft.x = Math.max(0, position.x - WINDOW_SIZE / 2);
	topLeft.y = Math.max(0, position.y - WINDOW_SIZE / 2);
}
 
function checkColor(event){
  var x = topLeft.x;
  var y = topLeft.y;
  var pixels = ctx.getImageData(x, y, WINDOW_SIZE, WINDOW_SIZE);
  colors = [0, 0, 0];
  for(var i = 0; i < pixels.data.length; i = i + 4){
      colors[0] += pixels.data[i];
      colors[1] += pixels.data[i + 1];
      colors[2] += pixels.data[i + 2];
  }

  for (var i=0; i<3; i++){
  	colors[i] = Math.floor(colors[i] / pixels.data.length * 4);
  }

  log.textContent = "平均値 = " + 
    colors[0] + "," +
    colors[1] + "," +
    colors[2];
}
 
function update(){
	if (video.readyState == 4){
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    checkColor();	
    document.body.style.backgroundColor = "rgb("+colors[0]+","+colors[1]+","+colors[2]+")";
    
    audio();
	}
  requestAnimationFrame(update);
}
 
function streamAcquired(stream){
    video.src = window.URL.createObjectURL(stream);
    video.play();
  	setTimeout(update,1000);
}
 
function error(msg){
  console.log(msg);
}

function initAudioContext(){
  try{    
    context = new AudioContext();
    oscillator = context.createOscillator();
    gainNode = context.createGain();
    filter = context.createBiquadFilter();
    filter.Q.value = 100;
    oscillator.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(context.destination);
    
    oscillator.start();
  } catch(e) {
    console.log(e);
  }
  context.samplingRate = 48000;
}
 
function initialize(){
  navigator.getUserMedia = 
    navigator.getUserMedia ||
    navigator.mozGetUserMedia;
  
  navigator.getUserMedia({video: true, audio:false},
                         streamAcquired,
                         error);

  initAudioContext();
}
 
canvas.addEventListener("click", setPosition);
initialize();







function getFreq(color1) {
  return (color1 * 10) + 200;
}

function getVolume(color2){
  return color2/128; 
}

function getFilterType(color3) {
  if (color3 >= 0 && color3 <= 64) {
    return "lowpass";
  } else if (color3 >= 192 && color3 <= 255) {
    return "highpass";
  }
  return null;
}

function getFilterFreq(color3) {
  return color3 * 4;
}

function audio(){
  oscillator.frequency.value = getFreq(colors[0] * 2);
  gainNode.gain.value = getVolume(colors[1]);//色2
  filter.type = getFilterType(colors[2]);//色3
  filter.frequency.value = getFilterFreq(colors[2]);//色3
}
