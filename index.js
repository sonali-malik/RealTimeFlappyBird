angular.module('myApp', ['ngTouch', 'ui.bootstrap'])
 
  .run(['$translate', '$log', 'realTimeService', 'randomService','resizeGameAreaService',
      function ($translate, $log, realTimeService, randomService, resizeGameAreaService) {
'use strict';


// Constants
var canvasWidth = 300;
var canvasHeight = 300;
var playerIndex = null;
var matchController = null;
 var startMatchTime;
 var playersInfo = [];
  var firstStart = true;
//var d = new Date();
//var curTime=d.getTime();
var randomIndex= 1;
// There are 1-8 players.
// Colors:
// black: canvas borders
// white: canvas background
// green: food
var playerColor = [
  'blue', 'red', 'brown', 'purple',
  'pink', 'yellow', 'orange', 'silver',
];
var colorImgSrc = ['imgs/bird_blue.png','imgs/bird_red.png','imgs/bird_brown.png','imgs/bird_purple.png',
'imgs/bird_pink.png','imgs/bird_yellow.png','imgs/bird_orange.png','imgs/bird_silver.png'];

        window.requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000);
            };
        })();
         //sounds

        var soundJump = new Audio("audio/wing.ogg");
        var soundScore = new Audio("audio/point.ogg");
        var soundHit = new Audio("audio/hit.ogg");
        var soundDie = new Audio("audio/die.ogg");
        var soundSwoosh = new Audio("audio/swooshing.ogg");
         //http://www.storiesinflight.com/html5/audio.html
        var channel_max = 10; // number of channels
        var audiochannels = new Array();
        for (var a = 0; a < channel_max; a++) { // prepare the channels
            audiochannels[a] = new Array();
            audiochannels[a]['channel'] = new Audio(); // create a new audio object
            audiochannels[a]['finished'] = -1; // expected end time for this channel
        }

        function play_sound(s) {
            for (var a = 0; a < audiochannels.length; a++) {
                var thistime = new Date();
                if (audiochannels[a]['finished'] < thistime.getTime()) { // is this channel finished?
                    audiochannels[a]['finished'] = thistime.getTime() + s.duration * 1000;
                    audiochannels[a]['channel'].src = s.src;
                    audiochannels[a]['channel'].load();
                    audiochannels[a]['channel'].play();
                    break;
                }
            }
        }
        
        function getCookie(cname)
        {
           var name = cname + "=";
           var ca = document.cookie.split(';');
           for(var i=0; i<ca.length; i++) 
           {
              var c = ca[i].trim();
              if (c.indexOf(name)==0) return c.substring(name.length,c.length);
           }
           return "";
        }
        function setCookie(cname,cvalue,exdays)
        {
           var d = new Date();
           d.setTime(d.getTime()+(exdays*24*60*60*1000));
           var expires = "expires="+d.toGMTString();
           document.cookie = cname + "=" + cvalue + "; " + expires;
        }   

        
        function createFB(playerIndex){

         // namespace our game
        var FB = {
            // set up some inital values
            WIDTH: 320,
            HEIGHT: 480,
            scale: 1,
            // the position of the canvas
            // in relation to the screen
            offset: {
                top: 0,
                left: 0
            },
            // store all bird, touches, pipes etc
            entities: [],
            currentPlayerIndex:playerIndex,
            currentWidth: null,
            currentHeight: null,
            canvas: null,
            ctx: null,
            score: {
                taps: 0,
                coins: 0
            },
            distance: 0,
            digits:[],
            fonts:[],
            // we'll set the rest of these
            // in the init function
            RATIO: null,
            bg_grad: "day",
            game:null,
           // currentWidth: null,
            //currentHeight: null,
           // canvas: null,
           // ctx: null,
            ua: null,
            android: null,
            ios: null,
            gradients: {},
            init: function (canvas,playerIndex) {
                console.log('in init');
                FB.currentPlayerIndex = playerIndex;
                var grad;
                // the proportion of width to height
                FB.RATIO = FB.WIDTH / FB.HEIGHT;
                // these will change when the screen is resize
                FB.currentWidth = FB.WIDTH;
                FB.currentHeight = FB.HEIGHT;
                // this is our canvas element
                //FB.canvas = document.getElementsByTagName('canvas')[0];
                FB.canvas = canvas;
                // it's important to set this
                // otherwise the browser will
                // default to 320x200
                FB.canvas.width = FB.WIDTH;
                FB.canvas.height = FB.HEIGHT;
                // the canvas context allows us to 
                // interact with the canvas api
                FB.ctx = FB.canvas.getContext('2d');

                // we need to sniff out android & ios
                // so we can hide the address bar in
                // our resize function
                FB.ua = navigator.userAgent.toLowerCase();
                FB.android = FB.ua.indexOf('android') > -1 ? true : false;
                FB.ios = (FB.ua.indexOf('iphone') > -1 || FB.ua.indexOf('ipad') > -1) ? true : false;

                // setup some gradients
                grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
                grad.addColorStop(0, '#036');
                grad.addColorStop(0.5, '#69a');
                grad.addColorStop(1, 'yellow');
                FB.gradients.dawn = grad;

                grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
                grad.addColorStop(0, '#69a');
                grad.addColorStop(0.5, '#9cd');
                grad.addColorStop(1, '#fff');
                FB.gradients.day = grad;

                grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
                grad.addColorStop(0, '#036');
                grad.addColorStop(0.3, '#69a');
                grad.addColorStop(1, 'pink');
                FB.gradients.dusk = grad;

                grad = FB.ctx.createLinearGradient(0, 0, 0, FB.HEIGHT);
                grad.addColorStop(0, '#036');
                grad.addColorStop(1, 'black');
                FB.gradients.night = grad;

                // listen for clicks
                FB.canvas.addEventListener('click', function (e) {
                    e.preventDefault();
                    FB.Input.set(e);
                }, false);

                // listen for touches
                FB.canvas.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    // the event object has an array
                    // called touches, we just want
                    // the first touch
                    console.log('touch=',e.touches[0]);
                    FB.Input.set(e.touches[0]);
                }, false);
                FB.canvas.addEventListener('touchmove', function (e) {
                    // we're not interested in this
                    // but prevent default behaviour
                    // so the screen doesn't scroll
                    // or zoom
                    e.preventDefault();
                }, false);
                FB.canvas.addEventListener('touchend', function (e) {
                    // as above
                    e.preventDefault();
                }, false);

                // we're ready to resize
             //   FB.resize();
                FB.changeState("Splash");
                
                FB.loop();

            },

           
                        
            // this is where all entities will be moved
            // and checked for collisions etc
            update: function () {
                FB.game.update();
                FB.Input.tapped = false;
            },

            // this is where we draw all the entities
            render: function () {

                FB.Draw.rect(0, 0, FB.WIDTH, FB.HEIGHT, FB.gradients[FB.bg_grad]);
                 var myBird = null;
                // cycle through all entities and render to canvas
                for (var i = 0; i < FB.entities.length; i += 1) {
                    if(FB.entities[i].type!='bird'){
                        FB.entities[i].render();
                    }
                    // else {

                    // }
                    // else if(FB.entities[i].playerIndex != getYourPlayerIndex()){
                    //     FB.entities[i].render();
                    // }
                    // else {
                    //     myBird = FB.entities[i];
                    // }    

                   

                }
               
                FB.game.render();
                
            },

            // the actual loop
            // requests animation frame
            // then proceeds to update
            // and render
            loop: function () {

                //requestAnimFrame(FB.loop);
                if(!isGameOngoing) {
                    return;
                }

                FB.update();
                FB.render();
            },
            changeState: function(state) {                   
                FB.game = new window[state](FB);
                FB.game.init();
            }
        };


 
         // abstracts various canvas operations into
         // standalone functions
        FB.Draw = {

            clear: function () {
                FB.ctx.clearRect(0, 0, FB.WIDTH, FB.HEIGHT);
            },

            rect: function (x, y, w, h, col) {
                FB.ctx.fillStyle = col;
                FB.ctx.fillRect(x, y, w, h);
            },
            circle: function (x, y, r, col) {
                FB.ctx.fillStyle = col;
                FB.ctx.beginPath();
                FB.ctx.arc(x + 5, y + 5, r, 0, Math.PI * 2, true);
                FB.ctx.closePath();
                FB.ctx.fill();
            },
            Image:function(img,x,y){                
                FB.ctx.drawImage(img,x,y);
            },
            Sprite: function (img, srcX, srcY, srcW, srcH, destX, destY, destW, destH, r) {
                FB.ctx.save();
                FB.ctx.translate(destX, destY);
                FB.ctx.rotate(r * (Math.PI / 180));
                FB.ctx.translate(-(destX + destW / 2), -(destY + destH / 2));
                FB.ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH);
                FB.ctx.restore();
            },
            semiCircle: function (x, y, r, col) {
                FB.ctx.fillStyle = col;
                FB.ctx.beginPath();
                FB.ctx.arc(x, y, r, 0, Math.PI, false);
                FB.ctx.closePath();
                FB.ctx.fill();
            },

            text: function (string, x, y, size, col) {
                FB.ctx.font = 'bold ' + size + 'px Monospace';
                FB.ctx.fillStyle = col;
                FB.ctx.fillText(string, x, y);
            }

        };

        FB.Input = {

            x: 0,
            y: 0,
            tapped: false,

            set: function (data) {
                this.x = (data.pageX - FB.offset.left) / FB.scale;
                this.y = (data.pageY - FB.offset.top) / FB.scale;
                this.tapped = true;

            }

        };

        FB.Cloud = function (x, y) {

            this.x = x;
            this.y = y;
            this.r = 30;
            this.col = 'rgba(255,255,255,1)';
            this.type = 'cloud';
            // random values so particles do no
            // travel at the same speeds
            this.vx = -0.10;

            this.remove = false;

            this.update = function () {

                // update coordinates
                this.x += this.vx;
                if (this.x < (0 - 115)) {
                    this.respawn();
                }

            };


            this.render = function () {

                FB.Draw.circle(this.x + this.r, (this.y + this.r), this.r, this.col);
                FB.Draw.circle(this.x + 55, (this.y + this.r / 2), this.r / 0.88, this.col);
                FB.Draw.circle(this.x + 55, (this.y + this.r + 15), this.r, this.col);
                FB.Draw.circle(this.x + 85, (this.y + this.r), this.r, this.col);


            };

            this.respawn = function () {

                this.x = ~~ (randomService.random(x) * this.r * 2) + FB.WIDTH;
                this.y = ~~ (randomService.random(y) * FB.HEIGHT / 2)


            };

        };

        FB.BottomBar = function (x, y, r) {

            this.x = x;
            this.y = y
            this.r = r;
            this.vx = -1;
            this.name = 'BottomBar';

            this.update = function () {
                // update coordinates
                this.x += this.vx;
                if (this.x < (0 - this.r)) {
                    this.respawn();
                }
            };

            this.render = function () {
                FB.Draw.rect(this.x, this.y, this.r, 100, '#D2691E');
                for (var i = 0; i < 10; i++) {
                    FB.Draw.semiCircle(this.x + i * (this.r / 9), this.y, 20, '#050');
                }
            }

            this.respawn = function () {
                this.x = FB.WIDTH - 1;
            }

        }

        FB.Tree = function (x, y) {

            this.x = x;
            this.y = y
            this.r = 30;
            this.h = 50;
            this.w = this.r * 2;
            this.vx = -1;
            this.type = 'Tree';

            this.update = function () {
                // update coordinates
                this.x += this.vx;
                if (this.x < (0 - this.r * 2)) {
                    this.respawn();
                }
            };

            this.render = function () {

                //FB.Draw.rect(this.x, this.y, this.w, this.h, '#c20');
                FB.Draw.circle(this.x + this.r, (this.y + this.r) - 10, this.r, 'green', '#050');
                FB.Draw.circle(this.x + (this.r / 2), (this.y + this.r) - 10, this.r / 3, 'rgba(0,0,0,0.08)');
                FB.Draw.rect(this.x + this.r, this.y + this.r, 10, this.r, 'brown', '#d20');
            }

            this.respawn = function () {
                this.x = FB.WIDTH + this.r;
            }


        }

        FB.Pipe = function (x, w) {

            this.centerX = x;
            this.coin = true
            this.w = w;
            this.h = FB.HEIGHT - 150;
            this.vx = -1;
            this.type = 'pipe';


            this.update = function () {
                // update coordinates
                this.centerX += this.vx;
                if (this.centerX == (0 - this.w)) {
                    this.respawn();
                }
            };

            this.render = function () {

                if (this.coin) {
                    FB.Draw.circle(this.centerX + this.w / 2 - 5, this.centerY - 5, 5, "Gold")
                }
                FB.Draw.rect(this.centerX, 0, this.w, this.centerY - 50, '#8ED6FF');
                FB.Draw.rect(this.centerX, this.centerY + 50, this.w, this.h - this.centerY, '#8ED6FF');
            }

            this.respawn = function () {
                this.centerY = this.randomIntFromInterval(70, 220);
                this.centerX = 320 - this.w + 160;
                this.coin = true;
            }

            this.randomIntFromInterval = function (min, max) {
                return randomService.randomFromTo(x,min,max) ;
            }

            this.centerY = this.randomIntFromInterval(70, 220);
        }

        FB.Bird = function (playerIndex) {

            this.img = new Image();
            this.img.src = colorImgSrc[playerIndex];
            this.gravity = 0.25;
            this.width = 34;
            this.height = 24;
            this.ix = 0;
            this.iy = 0;
            this.fr = 0;
            this.vy = 180;
            //+(20*playerIndex);
            this.vx = 70;
            this.velocity = 0;
            this.play = false;
            this.jump = -4.6;
            this.rotation = 0;
            this.type = 'bird';
            this.playerIndex = playerIndex;
            this.update = function () {
                if (this.fr++ > 5) {
                    this.fr = 0;
                    if (this.iy == this.height * 3) {
                        this.iy = 0
                    }
                    this.iy += this.height;
                }
                if (this.play) {
                    this.velocity += this.gravity;
                    this.vy += this.velocity;
                    if (this.vy <= 0) {
                        this.vy = 0;
                    }
                    if (this.vy >= 370) {
                        this.vy = 370;
                    }
                    this.rotation = Math.min((this.velocity / 10) * 90, 90);
                }
                if (FB.Input.tapped) {
                    this.play = true;
                    play_sound(soundJump);
                    this.velocity = this.jump;
                }
            };

            this.render = function () {

                FB.Draw.Sprite(this.img, this.ix, this.iy, this.width, this.height, this.vx, this.vy, this.width, this.height, this.rotation);
            }

        }

        FB.Particle = function (x, y, r, col, type) {

            this.x = x;
            this.y = y;
            this.r = r;
            this.col = col;
            this.type = type || 'circle';
            this.name = 'particle';

            // determines whether particle will
            // travel to the right of left
            // 50% chance of either happening
            this.dir = (randomService.random(x) * 2 > 1) ? 1 : -1;

            // random values so particles do no
            // travel at the same speeds
            this.vx = ~~ (randomService.random(x) * 4) * this.dir;
            this.vy = ~~ (randomService.random(y) * 7);

            this.remove = false;

            this.update = function () {

                // update coordinates
                this.x += this.vx;
                this.y -= this.vy;

                // increase velocity so particle
                // accelerates off screen
                this.vx *= 0.99;
                this.vy *= 0.99;

                // adding this negative amount to the
                // y velocity exerts an upward pull on
                // the particle, as if drawn to the
                // surface
                this.vy -= 0.35;

                // offscreen
                if (this.y > FB.HEIGHT) {
                    this.remove = true;
                }

            };


            this.render = function () {
                if (this.type === 'star') {
                    FB.Draw.star(this.x, this.y, this.col);
                } else {
                    FB.Draw.circle(this.x, this.y, this.r, this.col);
                }
            };

        };

         // checks if two entities are touching
        FB.Collides = function (bird, pipe) {
        
            if(bird.vy >=370){                
                 
                 return true;
            }
            if (pipe.coin && bird.vx > pipe.centerX + pipe.w / 2 - 5) {
                pipe.coin = false;
                FB.score.coins += 1;
                FB.digits = FB.score.coins.toString().split('');
                play_sound(soundScore);
            }

            var bx1 = bird.vx - bird.width / 2;
            var by1 = bird.vy - bird.height / 2;
            var bx2 = bird.vx + bird.width / 2;
            var by2 = bird.vy + bird.height / 2;

            var upx1 = pipe.centerX;
            var upy1 = 0;
            var upx2 = pipe.centerX + pipe.w;
            var upy2 = pipe.centerY - 50;


            var lpx1 = pipe.centerX;
            var lpy1 = pipe.centerY + 50;
            var lpx2 = upx2;
            var lpy2 = pipe.h;

            var c1 = !(bx1 > upx2 ||
                bx2 < upx1 ||
                by1 > upy2 ||
                by2 < upy1)
            var c2 = !(bx1 > lpx2 ||
                bx2 < lpx1 ||
                by1 > lpy2 ||
                by2 < lpy1)

            return (c1 || c2)

        };
            return FB;
        }

        function createCanvasController(canvas) {
   
   window.isGameOngoing = false;
   
  var yourPlayerIndex = -1;
  function getYourPlayerIndex(){
    return yourPlayerIndex;
  }
  var isSinglePlayer = false;  
 


     //   window.addEventListener('load', FB.init, false);
       
  var FB1;

  function gotStartMatch(params) {
    yourPlayerIndex = params.yourPlayerIndex;
    playersInfo = params.playersInfo;
    console.log('playersInfo=',playersInfo.length)
    matchController = params.matchController;
    isGameOngoing = true;
    isSinglePlayer = playersInfo.length === 1;
    startMatchTime = new Date().getTime();


    $log.info("gotStartMatch:", params);
    //Starts the match
    resizeGameAreaService.setWidthToHeight(0.5);
     FB1 = createFB(yourPlayerIndex);
    if(firstStart){
       
        FB1.init(canvas,yourPlayerIndex);
   //     firstStart = false;

    setTimeout(function(
    ){FB1.changeState('Play');
                    FB1.Input.tapped = false;
    setDrawInterval();},2000);
    }
    else {
        setTimeout(function(
    ){
            FB1.init(canvas,yourPlayerIndex);
            
           },2000);
        setTimeout(function(
    ){
            
            
            FB1.changeState('Play');
                   FB1.Input.tapped = false;
    setDrawInterval();},5000);
    }
    
    


}
   function gotMessage(params) {}
   function gotEndMatch(endMatchScores) {
    // allScores = endMatchScores;
    isGameOngoing = false;
   }

     var drawInterval;

  function setDrawInterval() {
    stopDrawInterval();
    // Every 2 food pieces we increase the snake speed (to a max speed of 50ms interval).
   // var intervalMillis = Math.max(50, drawEveryMilliseconds - 10 * Math.floor(foodCreatedNum / 2));
    drawInterval = setInterval(FB1.loop, 1000/60);
  }

  function stopDrawInterval() {
    clearInterval(drawInterval);
  }

  window.Splash = function(FB){
            
            this.banner = new Image();
            this.banner.src = "imgs/splash.png";
            
            this.init = function(){
                play_sound(soundSwoosh);
                FB.distance = 0;
                FB.bg_grad = "day";
                FB.entities = [];
                FB.score.taps = FB.score.coins = 0;
                //Add entities
                FB.entities.push(new FB.Cloud(30, ~~ (randomService.random(randomIndex) * FB.HEIGHT / 2)));
                FB.entities.push(new FB.Cloud(130, ~~ (randomService.random(randomIndex) * FB.HEIGHT / 2)));
                FB.entities.push(new FB.Cloud(230, ~~ (randomService.random(randomIndex) * FB.HEIGHT / 2)));
                for (var i = 0; i < 2; i += 1) {
                    FB.entities.push(new FB.BottomBar(FB.WIDTH * i, FB.HEIGHT - 100, FB.WIDTH));
                }
                FB.entities.push(new FB.Tree(~~(randomService.random(randomIndex) * FB.WIDTH), FB.HEIGHT - 160));
                FB.entities.push(new FB.Tree(~~(randomService.random(randomIndex) * FB.WIDTH + 50), FB.HEIGHT - 160));
                FB.entities.push(new FB.Tree(~~(randomService.random(randomIndex) * FB.WIDTH + 100), FB.HEIGHT - 160));
            }
            
            this.update = function(){
                for (var i = 0; i < FB.entities.length; i += 1) {
                    FB.entities[i].update();                    
                }
                if (FB.Input.tapped) {
                    //FB.changeState('Play');
                    FB.Input.tapped = false;
                }
            }
            
            this.render = function(){ 
             var meter = new FPSMeter(document.body );
             meter.tick();
               var secondsFromStart =
      Math.floor((new Date().getTime() - startMatchTime) / 1000);
    //  console.log(secondsFromStart);
                FB.Draw.Image(this.banner,66,100);
                if (secondsFromStart < 6) {
    // console.log("countdown");
      // Draw countdown
      var secondsToReallyStart = 4 - secondsFromStart;



      // Gives you a hint what is your color
      var yourColor = playerColor[0];
     
      var msg = $translate("YOUR_BIRD_COLOR_IS",
          {color: $translate(yourColor.toUpperCase())});
      //ctx.fillText(msg, canvasWidth / 4 - 30, canvasHeight / 4 - 30);
        //                  drawService.draw_prompt(ctx, yourPlayerIndex, secondsToReallyStart, level.level);

    FB.Draw.text(msg,canvasWidth / 4 - 60, canvasHeight / 4 - 30, 20, yourColor );

      FB.Draw.text("" + secondsToReallyStart,canvasWidth / 2 , canvasHeight / 2 -40, 40, yourColor);
    
      }
            }
        
        }
        
        window.Play = function(FB){
            
            this.init = function(){         
                 console.log('started playing');
                
                FB.entities.push(new FB.Pipe(FB.WIDTH * 2, 50));
                FB.entities.push(new FB.Pipe(FB.WIDTH * 2 + FB.WIDTH / 2, 50));
                FB.entities.push(new FB.Pipe(FB.WIDTH * 3, 50));

               // FB.bird = new FB.Bird();
                //FB.entities.push(FB.bird);

                FB.bird = [];
                if(yourPlayerIndex == -1){
                    yourPlayerIndex = 0;
                }
                for(var i=0; i < playersInfo.length; i++){
                    console.log('andar');
                    if(i!=yourPlayerIndex)
                    {
                       FB.bird[i] = new FB.Bird(i);    
                       FB.entities.push(FB.bird[i]);
                    }
                }
                    FB.bird[yourPlayerIndex] = new FB.Bird(yourPlayerIndex);    
                    FB.entities.push(FB.bird[yourPlayerIndex]);
                for(var n=0;n<10;n++){
                    var img = new Image();
                    img.src = "imgs/font_small_" + n +'.png';
                    FB.fonts.push(img);
                }
                FB.digits = ["0"];
            }
            
            this.update = function() { 
                
                FB.distance += 1;
                var levelUp = ((FB.distance % 2048) === 0) ? true : false;
                if (levelUp) {
                    var bg = "day";
                    var gradients = ["day", "dusk", "night", "dawn"];
                    for (var i = 0; i < gradients.length; i++) {
                        if (FB.bg_grad === gradients[i]) {
                            if (i == gradients.length - 1) {
                                bg = "day";
                            } else {
                                bg = gradients[i + 1];
                            }
                        }
                    }
                    FB.bg_grad = bg;
                }


                var checkCollision = false; // we only need to check for a collision
                // if the user tapped on this game tick




                // if the user has tapped the screen
                if (FB.Input.tapped) {
                    // keep track of taps; needed to 
                    // calculate accuracy
                    FB.score.taps += 1;

                    // set tapped back to false           
                    // in the next cycle

                    checkCollision = true;
                }
                var myBird;
                // cycle through all entities and update as necessary
                for (i = 0; i < FB.entities.length; i += 1) {
                    //FB.entities[i].update();
                    if(FB.entities[i].type!='bird'){
                        FB.entities[i].update();
                    }
                    else if(FB.entities[i].playerIndex != FB.currentPlayerIndex){
                        FB.entities[i].update();
                    }
                    else {
                        myBird = FB.entities[i];
                    }
                    if (FB.entities[i].type === 'pipe') {

                        for (var j = 0;j<playersInfo.length; j++){
                            var hit = FB.Collides(FB.bird[j], FB.entities[i]);
                        if (hit) {
                         //   play_sound(soundHit);
                            FB.changeState('GameOver');
                             break;
                        }    
                        }

                        // var hit = FB.Collides(FB.bird, FB.entities[i]);
                        // if (hit) {
                        //  //   play_sound(soundHit);
                        //     FB.changeState('GameOver');
                        //      break;
                        // }
                    }
                }

                myBird.update();
            }
            
            this.render = function() { 
             //  var meter = new FPSMeter(document.body );
             // meter.tick();  
                //score     
                var myBird; 
                //BIRD ON TOP     
                for (i = 0; i < FB.entities.length; i += 1) {
                    //FB.entities[i].update();
                    if(FB.entities[i].type==='bird'){
                        if(FB.entities[i].playerIndex != FB.currentPlayerIndex){
                            FB.entities[i].render();
                        }
                        else {
                            myBird = FB.entities[i];
                        }
                    }
                }

                myBird.render();

                var X = (FB.WIDTH/2-(FB.digits.length*14)/2);               
                for(var i = 0; i < FB.digits.length; i++)
                {
                  FB.Draw.Image(FB.fonts[Number(FB.digits[i])],X+(i*14),10);
                }
            }
        
        }
        
        window.GameOver = function(FB){
            var score = FB.score.coins;
                           

            this.getMedal = function()
            {
             var medal;
               
               console.log('score=',score);
               if(score <= 10)
                  medal = "bronze";
               if(score >= 20)
                  medal = "silver";
               if(score >= 30)
                  medal = "gold";
               if(score >= 40)
                  medal = "platinum";
            
                return medal;
            }
            this.getHighScore = function(){
                var savedscore = getCookie("highscore");
                if(savedscore != ""){
                    var hs = parseInt(savedscore) || 0;
                    if(hs < FB.score.coins)
                    {
                     hs = FB.score.coins
                     setCookie("highscore", hs, 999);
                    }
                    return hs;
                  }
                  else
                  {                  
                    setCookie("highscore", FB.score.coins, 999);
                    return  FB.score.coins;
                  }
            }
            this.init = function(){
                        
                var that = this;
                setTimeout(function() {
                     var color = playerColor[0];
     // ctx.fillStyle = color;
      var msg = $translate("COLOR_SCORE_IS",
          {color: $translate(color.toUpperCase()), score: "" + that.getHighScore()});

                    play_sound(soundDie);
                    that.banner = new Image();
                    that.banner.src = "imgs/scoreboard.png";
                    var m = that.getMedal();
                    that.medal =  new Image();
                    that.medal.src = 'imgs/medal_' + m +'.png';
                    that.replay = new Image();
                    that.replay.src = "imgs/replay.png";
                    that.highscore = that.getHighScore() ;
             FB.Draw.text(msg,canvasWidth / 4 - 60, canvasHeight / 4 - 30, 30, color );
                }, 500);
                
            }
            
            this.update = function(){               
                if (FB.Input.tapped) {
                    var x = FB.Input.x;
                    var y = FB.Input.y;
                    
                     if((x >= 102.5 && x <= 102.5+115) && (y >= 260 && y <= 260+70)){       
                        FB.changeState('Splash');
                    }
                    FB.Input.tapped = false;
                }
                FB.bird.update();
                
            }
            
            this.render = function(){
             
                if(this.banner){
                    FB.Draw.Image(this.banner,42,70);
                    FB.Draw.Image(this.medal,75,183);
                //  FB.Draw.Image(this.replay,102.5,260);
                    FB.Draw.text(FB.score.coins, 220, 185, 15, 'black');
                    FB.Draw.text(this.highscore, 220, 225, 15, 'black');
                }
                setTimeout(function(){
                 
                },3000);
            }
                                 matchController.endMatch([score]);

        
        }

       return {
    gotStartMatch: gotStartMatch,
    gotMessage: gotMessage,
    gotEndMatch: gotEndMatch
  };
 }   
realTimeService.init({
  createCanvasController: createCanvasController,
  canvasWidth: canvasWidth,
  canvasHeight: canvasHeight
});
resizeGameAreaService.setWidthToHeight(0.5);
}])