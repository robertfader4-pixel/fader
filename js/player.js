const tracks = [
  { name: "Euforia silenciosa", file: "assets/audio/euforia.mp3" },
  { name: "15 мая, 21.54", file: "assets/audio/cover.mp3" },
  { name: "Запах мальбека", file: "assets/audio/malbec.m4a" }
];

let audio = new Audio();
let current = 0;

function playTrack(i){
  current = i;
  audio.src = tracks[i].file;
  audio.play();
  document.getElementById("trackName").innerText = tracks[i].name;
}

function togglePlay(){
  if(audio.paused) audio.play();
  else audio.pause();
}

function next(){
  current = (current + 1) % tracks.length;
  playTrack(current);
}

function closePlayer(){
  audio.pause();
  document.getElementById("miniPlayer").style.display = "none";
}

// draggable
let player = document.getElementById("miniPlayer");
let isDown = false, offset = [0,0];

player.addEventListener('mousedown', e=>{
  isDown = true;
  offset = [
    player.offsetLeft - e.clientX,
    player.offsetTop - e.clientY
  ];
});

document.addEventListener('mouseup', ()=> isDown=false);

document.addEventListener('mousemove', e=>{
  if(isDown){
    player.style.left = (e.clientX + offset[0]) + 'px';
    player.style.top = (e.clientY + offset[1]) + 'px';
  }
});
