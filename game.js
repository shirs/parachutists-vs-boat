/**
/**
 * an object (singleton) to hold all global references of objects
 * that are required for game course 
 *(boat for collision detection, stat for displaying game statistics)
 */
var spriteRepository = new function() {
	this.boat = null;
	this.stats = null;
}


/**
/**
 * an object (singleton) to hold all the images for the game
 * so images are only created once 
 */
var imageRepository = new function() {
	// define images
	this.background = new Image();
	this.boat = new Image();
	this.airplane = new Image();
	this.parachutist = new Image();
	this.ocean = new Image();
	// ensure all images have loaded before starting the game:
	var numImages = 5;
	var numLoaded = 0;
	function imageLoaded() {
		numLoaded++;
		if (numLoaded === numImages) {
			window.init();
		}
	}
	this.background.onload = function() {
		imageLoaded();
	}
	this.boat.onload = function() {
		imageLoaded();
	}
	this.airplane.onload = function() {
		imageLoaded();
	}
	this.ocean.onload = function() {
		imageLoaded();
	}
	this.parachutist.onload = function() {
		imageLoaded();
	}
	// set images src
	this.background.src = "imgs/bg.png";
	this.boat.src = "imgs/boat.png";
	this.ocean.src = "imgs/ocean.png";
	this.airplane.src = "imgs/airplane.png";
	this.parachutist.src = "imgs/parachutist.png";
}



/**
 * drawable object is the base class for all drawable objects in the game,
 * includes default variables and default functions for its children to inherit.
 */
function Drawable() {
	this.init = function(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	// default variables
	this.x=0; 
	this.y=0;
	this.speed = 0;
	this.context = null;
	// abstract function to be implemented in child objects
	this.draw = function() {
	};
}



/**
 * ocean object to appear on the background, inherits from Drawable object.
*/
function Ocean(id) {

	this.oceanCanvas = document.getElementById(id);
	this.context = this.oceanCanvas.getContext('2d');
	var oceanHeight=150;
	this.init(0,this.oceanCanvas.height-oceanHeight, imageRepository.ocean.width, imageRepository.ocean.height);
		

	// implementation of parent abstract function
	this.draw = function() {
		this.context.drawImage(imageRepository.ocean, this.x, this.y);
	};
}
// inherit properties from Drawable
Ocean.prototype = new Drawable();



/**
 * background object to appear on the background, inherits from Drawable object.
*/
function Background(id) {
	this.bgCanvas = document.getElementById(id);
	this.context = this.bgCanvas.getContext('2d');
	this.init(0,0, imageRepository.background.width, imageRepository.background.height);

	// implementation of parent abstract function
	this.draw = function() {
		this.context.drawImage(imageRepository.background, this.x, this.y);
	};
}
//inherit properties from Drawable
Background.prototype = new Drawable();
 


/**
 * airplane object, inherits from Drawable object. will move from left to right in a loop.
 * will drop parachutists from time to time.
 */
function Airplane(id) {
	this.airplaneCanvas = document.getElementById(id);
	this.context = this.airplaneCanvas.getContext('2d');
	this.init(this.airplaneCanvas.width,0,imageRepository.airplane.width, 
		imageRepository.airplane.height);

	this.canvasWidth = this.airplaneCanvas.width;
	this.canvasHeight = this.airplaneCanvas.height;
	this.speed = 3;
	this.parachutistsPool = new ParachutistsPool();
	
	// implementation of parent abstract function
	this.draw = function() {
		//clear image from current location
		this.context.clearRect(this.x, this.y, this.width, this.height);
		//update x location
		this.x -= this.speed;
		// if the image scrolled off the screen, reset
		if (this.x <= 0 - this.width)
			this.x = this.canvasWidth;
		// draw another image at the new location (increasing x vals create visible movement continuity)
		this.context.drawImage(imageRepository.airplane, this.x, this.y);
	};

	
	
	this.startRandomlyDroppingParachutists= function() {
		var airplaneContext=this;
		var dropParachutistAtRandomTime = function() {
		//if airplane is in mid sky and not on the edges (a place in the sky where
		//the falling parachutist will be visible and catchable),
		//drop parachutists at random time intervals
			if (airplaneContext.x >= -imageRepository.airplane.width/2
				&& airplaneContext.x <=
				airplaneContext.canvasWidth - imageRepository.airplane.width/2 - imageRepository.parachutist.width)
			{
        		airplaneContext.dropParachutist();
        	}
 			//re-calc random number of seconds
        	var rand = Math.floor(Math.random() * (2000)) + 500; // generate new time (between 2sec and 0.5sec)
        	//if game is still active, keep on dropping parachutists
        	if (spriteRepository.stats.stillAlive()) {
        		setTimeout(dropParachutistAtRandomTime, rand);
        	}
    	}
    	dropParachutistAtRandomTime();	
	
	}
	
	
	this.dropParachutist = function() {
		this.parachutistsPool.get(this.x, this.y);
	};
}
//inherit properties from Drawable
Airplane.prototype = new Drawable();



/**
 * ParachutistsPool object orchestrates multiple parachutist
 */
function ParachutistsPool() {
	this.parachutistSpeed = 1.5;
	var pool = [];
	//put a new parachutist on the list
	//(triggered by another method in the airplane object)
	this.get = function(x, y, speed) {
		//creates a new parachutist object based on the airplane location at the time of the dropping
		pool[pool.length] = new Parachutist(x+(imageRepository.airplane.width/2), y+(imageRepository.airplane.height/2), this.parachutistSpeed);
	};

	//handles animation of every single parachutist on the screen:
	//using return value of pool[i].draw, determines whether item should be drawn
	//and stay on the list, or be removed from the list 
	this.animate = function() {
		for (var i = 0; i < pool.length; i++) {
			if (!pool[i].draw()) {
				pool.splice(i,1);
				//note: removing item from the list in that manner costs O(n),
				//but due to small number of potential parachutist items on the screen,
				//shouldn't be too costly.
				//could be optimised using linked list etc.
			}
		}
		
	};
}



/**
 * a parachutist object
 */
function Parachutist(x, y, speed) {
		this.oceanLevel = 250;
		this.speed = speed;
		this.init(x, y, imageRepository.parachutist.width,
			               imageRepository.parachutist.height);
	 //return value of this.draw method is used inside ParachutistsPool's "this.animate" function
	 //(see explanation there). 
	 //boolean return val - did drawing "succeed" (occurred)?
	 //succeeded (occurred) if in relevant boundaries,
	 //not caught by boat and not fallen in the ocean
	this.draw = function() {
		this.context.clearRect(this.x, this.y, this.width, this.height);
		this.y += this.speed;
		//detect whether parachutist fell in the ocean
		if (this.y >this.oceanLevel) {
			spriteRepository.stats.updateLives();
			return false; //out of sky boundaries, fell in ocean
		}
		//detect whether parachutist caught by boat - using bounding box
		else if(collides(this,spriteRepository.boat)) {
			spriteRepository.stats.updateScore();
			return false; //caught by boat
		}
		//else parachutist still in boundaries and should be drawn
		else {
			this.context.drawImage(imageRepository.parachutist, this.x, this.y);
			return true; //still in boundries
		}	
	};
	
	//detect collision using a bounding box
	function collides(rect1,rect2) {
  		return (rect1.x < rect2.x + rect2.width &&
   			rect1.x + rect1.width > rect2.x &&
   			rect1.y < rect2.y +70 + 3 &&
   			rect1.height + rect1.y > rect2.y +70);
	}

}
//inherit properties from Drawable
Parachutist.prototype = new Drawable();



/**
 * stats object to hold and handle game statistics.
 */
function Stats(id) {

	this.statsCanvas = document.getElementById(id);
	this.statsContext = this.statsCanvas.getContext('2d');               
	Stats.prototype.context = this.statsContext;
	this.init(0, 0, this.statsCanvas.width, this.statsCanvas.height);          
			
	this.score = 0;
	this.lives = 3;
	this.scoreX = 30;
	this.scoreY = 30;
	this.livesX = 30;
	this.livesY = 55;
	
	this.updateLives = function () {
		if (this.stillAlive()) {
			this.lives--;
			this.draw();
		}
	}
	
	this.stillAlive = function () {
		if (this.lives>0) {
			return true;
		}
		else {
			return false;
		}
	}
	
	this.updateScore = function () {
		if (this.stillAlive()) {
			this.score++;
			this.draw();
		}
	}

	this.context.font = "20px Arial";
	this.draw = function() {
		//clear previous stats from the context:
		this.context.clearRect(this.x, this.y, this.width, this.height);
		//value update: done in the background upon parachutist hitting ocean/boat
		//redraw:
		this.context.globalAlpha=0.4;
		this.context.fillStyle='white';
		this.context.fillRect(5,5,145,80);
		this.context.globalAlpha=1;
		this.context.fillStyle = 'brown';
		this.context.fillText("Score: " + this.score,this.scoreX,this.scoreY);
		this.context.fillText("Lives: " + this.lives,this.livesX,this.livesY);
	};
	//initial stats
	this.draw();

}
//inherit properties from Drawable
Stats.prototype = new Drawable();



/**
 * ship object that the player controls. moves left<->right on the screen, catches parachutists.
 */
function Boat(id) {

	this.boatCanvas = document.getElementById(id);
	this.context = this.boatCanvas.getContext('2d');
	//init boat to first appear on center of the screen:
	var boatStartX = this.boatCanvas.width/2 - imageRepository.boat.width/2;
	var boatStartY = this.boatCanvas.height - imageRepository.ocean.height / 2 + 20;
	this.init(boatStartX, boatStartY, imageRepository.boat.width,
			               imageRepository.boat.height);
			               
	this.canvasWidth = this.boatCanvas.width;
	this.canvasHeight = this.boatCanvas.height;
	this.speed = 30;
	var leftKey = 37;
	var rightKey = 39;
	this.draw = function() {
		this.context.drawImage(imageRepository.boat, this.x, this.y);
	};
	this.keyDownCallback = function(event) {
			// Determine if the action is move action
  			var keyCode = event.keyCode;
  			//if player hit left/right keys
			if (keyCode==leftKey|| keyCode==rightKey) {
				// user pressed key to move
				//erase image from current position (before the move)	
				this.context.clearRect(this.x, this.y, this.width, this.height);
				// update x according to the direction to move
				if (keyCode==leftKey) {
					this.x -= this.speed
					if (this.x <= 0) // keep player within the screen
						this.x = 0;
				} else if (keyCode==rightKey) {
					this.x += this.speed
					if (this.x >= this.canvasWidth - this.width) // keep player within the screen
						this.x = this.canvasWidth - this.width;
				}
				//redraw in new position
				this.draw();
			}
	}
	this.move = function() {
		var boatContext=this;
		document.onkeydown = function (event) {
			if(spriteRepository.stats.stillAlive()) {
				boatContext.keyDownCallback(event);
			}		
		}

	};
}
//inherit properties from Drawable
Boat.prototype = new Drawable();



/**
 * Creates the Game object which will hold all objects and data for
 * the game.
 */

 function Game() {
	
		this.init = function() {
		// get the bgCanvas element, first canvas element we'll try to handle
		this.bgCanvas = document.getElementById('background');
		// test to see if canvas is supported
		if (!this.bgCanvas.getContext) {
		//canvas is not supported
			return false
		}
		else {
		//canvas is supported
		
		//initialize main game objects and their context:
			this.background = new Background("background");

			this.ocean = new Ocean("ocean");

			this.airplane = new Airplane("airplane");
			
			spriteRepository.boat=new Boat("boat");	
			
			spriteRepository.stats = new Stats("stats");    

			this.parachutistsCanvas = document.getElementById('parachutists');              
			Parachutist.prototype.context = this.parachutistsCanvas.getContext('2d');        			                              
			               
			return true;
			
		}
	};
	
	
	// Start the animation loop
	this.start = function() {
		spriteRepository.boat.draw();
		this.background.draw();
		this.ocean.draw();
		this.airplane.startRandomlyDroppingParachutists();
		spriteRepository.boat.move();
		animate();
	};
	
	
	this.notifyGameOver = function() {
		this.canvas = document.getElementById('stats');
		this.context = this.canvas.getContext('2d');
		this.context.globalAlpha=0.4;
		this.context.fillStyle='white';
		this.context.fillRect(this.canvas.width/2-170,this.canvas.height/2-40,350,80);
		this.context.globalAlpha=1;
		this.context.fillStyle = 'brown';
		this.context.fillText("GAME OVER!",this.canvas.width/2-75,this.canvas.height/2-10);
		this.context.fillText("(refresh to replay)",this.canvas.width/2-95,this.canvas.height/2+30);
		var gameContext=this;
	}
	
		
}



/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */
function animate() {
	if (spriteRepository.stats.stillAlive() ) {
		requestAnimFrame( animate );
	}
	else {
		game.notifyGameOver();
	}
	game.airplane.parachutistsPool.animate();
	game.airplane.draw();
	

}



/**
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop,
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame   ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
})();



/**
 * initialize the Game and start it.
 */
var game = new Game();
function init() {
	if(game.init())
		game.start();
}