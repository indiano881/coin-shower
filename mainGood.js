// ----- Start of the assignment ----- //

// Configuration object for the coin animation system
const COINS_ANIMATION_CONFIG = {
	numCoins: 20,			// Number of coin sprites to create and animate
	duration: 1000,			// Duration of a single animation cycle in milliseconds
	startX: 400,			// Starting X position for each coin 
	startY: 225,			// Starting Y position for each coin 
	upwardChance: 0.4, 		// Probability (0 to 1) that a coin will start with upward gravity instead of downward
	minGravity: -3.0,		// Minimum gravity applied to coin movement (negative = upward force)
	maxGravity: 0.6,		// Maximum gravity applied to coin movement (positive = downward force)
	gravityAccellerator: 0.07, //Gravity acceleration per frame (added to current gravity each tick)
	gravityMultiplier: 3.5, // Controls how fast gravity affects movement on Y axis
	minSize: 0.15,			// Minimum initial size/scale for each coin
	maxSize: 0.35,			// Maximum initial size/scale for each coin
	minRotation: -0.4,		// Minimum initial rotation speed of coins (in radians per frame)
	maxRotation: 0.4,		// Maximum initial rotation speed of coins (in radians per frame)
	rotationDamping: 25,	// Slows down rotation speed (damping factor)
	minXVelocity: -7.0,		// Minimum horizontal velocity (how far coins move left/right)
	maxXVelocity: 7.0,		// Maximum horizontal velocity
	fadeAmount: 10,			// Alpha increment per frame (used for fade-in effect)
	fadeDivider: 100   		// Controls speed of fade-in (higher = slower fade-in)
};

class ParticleSystem extends PIXI.Container {
	constructor() {
		super();
		// Destructure config into local variables
		const {
			numCoins,
			duration,
			startX,
			startY,
			upwardChance,
			minGravity,
			maxGravity,
			gravityAccellerator,
			gravityMultiplier,
			minSize,
			maxSize,
			minRotation,
			maxRotation,
			rotationDamping,
			minXVelocity,
			maxXVelocity,
			fadeAmount,
			fadeDivider
		} = { ...COINS_ANIMATION_CONFIG };

		// Set start and duration for this effect in milliseconds
		this.duration = duration;
		this.start = 0;

		//Store reference to all coin sprites
		this.coins = [];

		// Store config in object for internal use
		this.cfg = {
			startX,
			startY,
			upwardChance,
			minGravity,
			maxGravity,
			gravityAccellerator,
			gravityMultiplier,
			minSize,
			maxSize,
			minRotation,
			maxRotation,
			rotationDamping,
			minXVelocity,
			maxXVelocity,
			fadeAmount,
			fadeDivider
		};

		// Create and initialize each coin
		for (let i = 0; i < numCoins; i++) {
			// Create a sprite
			let sp = game.sprite("CoinsGold000");
			// Set pivot to center of said sprite
			sp.pivot.x = sp.width / 2;
			sp.pivot.y = sp.height / 2;
			// Apply random scale
			sp.scale.x = sp.scale.y = this.minMaxRandom(minSize, maxSize);
			// Set starting position
			sp.x = startX;
			sp.y = startY;
			// Start fully transparent
			sp.alpha = 0;
			// Randomly decide if this coin moves upward initially
			const goUp = Math.random() < this.cfg.upwardChance; 
			// Store initial movement and rotation data
			sp.init = {
				gravity: goUp
					? this.minMaxRandom(minGravity, 0)
					: this.minMaxRandom(0, maxGravity),
				xVelocity: this.minMaxRandom(minXVelocity, maxXVelocity),
				rotation: this.minMaxRandom(minRotation, maxRotation),
				scale: sp.scale.x
			};
			// Store coin reference
			this.coins.push(sp);
			// Add to PIXI canvas
			this.addChild(sp);
		}
	}

	animTick(nt, lt, gt) {
		// Calculate frame index for sprite animation (0-8)
		const frame = ("000" + Math.floor((gt % this.duration) / this.duration * 9)).slice(-3);

		for (let i = 0; i < this.coins.length; i++) {
			const sp   = this.coins[i];
			const init = sp.init;
			const cfg  = this.cfg;

			// Update texture frame to simulate coin spinning
			game.setTexture(sp, "CoinsGold" + frame);

			// Apply fade in
			sp.alpha += cfg.fadeAmount / cfg.fadeDivider;
			sp.alpha  = Math.min(sp.alpha, 1);

			// Apply motion
			sp.x += init.xVelocity;
			sp.y += init.gravity * cfg.gravityMultiplier;

			// Apply rotation
			sp.rotation  += init.rotation / cfg.rotationDamping;

			// Simulate gravity acceleration
			init.gravity += cfg.gravityAccellerator;

			// Reset coins when out of screen
			if (sp.y > game.renderer.height) {
				this.resetParticle(sp);
			}
		}
	}

	// Reset a single coin to its initial state
	resetParticle(sp) {
		const cfg = this.cfg;
		sp.x      = cfg.startX;
		sp.y      = cfg.startY;
		sp.alpha  = 0;
		
		// Randomly decide direction (up or down)
		const goUp = Math.random() < this.cfg.upwardChance;

		// Re-randomize movement data
		sp.init.gravity = goUp
			? this.minMaxRandom(cfg.minGravity, 0)
			: this.minMaxRandom(0, cfg.maxGravity);

		sp.init.xVelocity = this.minMaxRandom(cfg.minXVelocity, cfg.maxXVelocity);
		sp.init.rotation  = this.minMaxRandom(cfg.minRotation, cfg.maxRotation);
		
	}

	// Utility method for random float between min and max
	minMaxRandom(min, max) {
		return Math.random() * (max - min) + min;
	}
}


// ----- End of the assignment ----- //
class Game {
	constructor(props) {
		this.totalDuration = 0;
		this.effects = [];
		this.renderer = new PIXI.WebGLRenderer(800,450);
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();
		this.loadAssets(props&&props.onload);
	}
	loadAssets(cb) {
		let textureNames = [];
		// Load coin assets
		for (let i=0; i<=8; i++) {
			let num  = ("000"+i).substr(-3);
			let name = "CoinsGold"+num;
			let url  = "gfx/CoinsGold/"+num+".png";
			textureNames.push(name);
			PIXI.loader.add(name,url);
		}
		PIXI.loader.load(function(loader,res){
			// Access assets by name, not url
			let keys = Object.keys(res);
			for (let i=0; i<keys.length; i++) {
				var texture = res[keys[i]].texture;
				if ( ! texture) continue;
				PIXI.utils.TextureCache[keys[i]] = texture;
			}
			// Assets are loaded and ready!
			this.start();
			cb && cb();
		}.bind(this));
	}
	start() {	
		this.isRunning = true;
		this.t0 = Date.now();
		update.bind(this)();
		function update(){
			if ( ! this.isRunning) return;
			this.tick();
			this.render();
			requestAnimationFrame(update.bind(this));
		}
	}
	addEffect(eff) {
		this.totalDuration = Math.max(this.totalDuration,(eff.duration+eff.start)||0);
		this.effects.push(eff);
		this.stage.addChild(eff);
	}
	render() {
		this.renderer.render(this.stage);
	}
	tick() {
		let gt = Date.now();
		let lt = (gt-this.t0) % this.totalDuration;
		for (let i=0; i<this.effects.length; i++) {
			let eff = this.effects[i];
			if (lt>eff.start+eff.duration || lt<eff.start) continue;
			let elt = lt - eff.start;
			let ent = elt / eff.duration;
			eff.animTick(ent,elt,gt);
		}
	}
	sprite(name) {
		return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
	}
	setTexture(sp,name) {
		sp.texture = PIXI.utils.TextureCache[name];
		if ( ! sp.texture) console.warn("Texture '"+name+"' don't exist!")
	}
}

window.onload = function(){
	window.game = new Game({onload:function(){
		game.addEffect(new ParticleSystem());
	}});
}
