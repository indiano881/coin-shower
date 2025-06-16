// ----- Start of the assignment ----- //

const COINS_ANIMATION_CONFIG = {
	numCoins: 20,// Number of coin sprites to create and animate
	duration: 1000,// Duration of a single animation cycle in milliseconds
	startX: 400,// Starting X position for each coin 
	startY: 225,// Starting Y position for each coin 
	minGravity: -3.0,// Minimum gravity applied to coin movement (negative = upward force)
	maxGravity: 1.5,// Maximum gravity applied to coin movement (positive = downward force)
	minSize: 0.25,// Minimum initial size/scale for each coin
	maxSize: 0.5,// Maximum initial size/scale for each coin
	minRotation: -1.0,// Minimum initial rotation speed of coins (in radians per frame)
	maxRotation: 1.0,// Maximum initial rotation speed of coins (in radians per frame)
	minXVelocity: -7.0,// Minimum horizontal velocity (how far coins move left/right)
	maxXVelocity: 7.0,// Maximum horizontal velocity
	fadeAmount: 10// Alpha increment per frame (used for fade-in effect)
};

class ParticleSystem extends PIXI.Container {
	constructor(config = {}) {
		super();

		const {
			numCoins,
			duration,
			startX,
			startY,
			minGravity,
			maxGravity,
			minSize,
			maxSize,
			minRotation,
			maxRotation,
			minXVelocity,
			maxXVelocity,
			fadeAmount
		} = { ...COINS_ANIMATION_CONFIG, ...config };

		this.duration = duration;
		this.start = 0;
		this.coins = [];
		this.cfg = {
			startX,
			startY,
			minGravity,
			maxGravity,
			minSize,
			maxSize,
			minRotation,
			maxRotation,
			minXVelocity,
			maxXVelocity,
			fadeAmount
		};

		for (let i = 0; i < numCoins; i++) {
			let sp = game.sprite("CoinsGold000");

			sp.pivot.x = sp.width / 2;
			sp.pivot.y = sp.height / 2;
			sp.scale.x = sp.scale.y = this.minMaxRandom(minSize, maxSize);
			sp.x = startX;
			sp.y = startY;
			sp.alpha = 0;

			const goUp = Math.random() < 0.4; // 40% chance to go up

			sp.init = {
				gravity: goUp
					? this.minMaxRandom(minGravity, -1)
					: this.minMaxRandom(1, maxGravity),
				xVelocity: this.minMaxRandom(minXVelocity, maxXVelocity),
				rotation: this.minMaxRandom(minRotation, maxRotation),
				scale: sp.scale.x
			};

			this.coins.push(sp);
			this.addChild(sp);
		}
	}

	animTick(nt, lt, gt) {
		const frame = ("000" + Math.floor((gt % this.duration) / this.duration * 8)).slice(-3);

		for (let i = 0; i < this.coins.length; i++) {
			const sp = this.coins[i];
			const init = sp.init;
			const cfg = this.cfg;

			// Update texture
			game.setTexture(sp, "CoinsGold" + frame);

			// Fade in
			sp.alpha += cfg.fadeAmount / 100;
			sp.alpha = Math.min(sp.alpha, 1);

			// Motion
			sp.x += init.xVelocity;
			sp.y += init.gravity * 4;

			// Rotation
			sp.rotation += init.rotation / 25;

			// Simulate gravity pull
			init.gravity += 0.1;

			// Reset if out of screen
			if (sp.y > game.renderer.height + 50) {
				this.resetParticle(sp);
			}
		}
	}

	resetParticle(sp) {
		const cfg = this.cfg;
		sp.x = cfg.startX;
		sp.y = cfg.startY;
		sp.alpha = 0;

		const goUp = Math.random() < 0.4;

		sp.init.gravity = goUp
			? this.minMaxRandom(cfg.minGravity, -1)
			: this.minMaxRandom(1, cfg.maxGravity);

		sp.init.xVelocity = this.minMaxRandom(cfg.minXVelocity, cfg.maxXVelocity);
		sp.init.rotation = this.minMaxRandom(cfg.minRotation, cfg.maxRotation);
	}

	minMaxRandom(min, max) {
		return Math.random() * (max - min) + min;
	}
}
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
