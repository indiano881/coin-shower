// ----- Start of the assigment ----- //
//Values to tweak. Usually you would want a file or a tool to modify these instead of them being hard-coded.
const defaultSprite = "CoinsGold000";
//Controls the minimum and maximum gravity amount
const minGravityAmount = -1.5;
const maxGravityAmount = 3.5;
//Controls the minimum and maximum size a coin can have
const minSize = 0.25;
const maxSize = 0.5;
//Controls the minimum and maximum rotation a coin can have
const minRotationAmm = -1.0;
const maxRotationAmm = 1.0;
//Controls the minimum and maximum horizontal velocity a coin can have
const minXVelocity = -5.5;
const maxXVelocity = 5.5;
//Controls the speed in which a coin becomes visible
const fadeAmount = 3;

class ParticleSystem extends PIXI.Container {
	constructor() {
		super();
		// Set start and duration for this effect in milliseconds
		this.start = 0;
		this.duration = 500;
		//Generate a set amount of particles and save them.
		this.particleDataset = this.generateParticles(10);
	}
	animTick(nt, lt, gt) {
		// Every update we get three different time variables: nt, lt and gt.
		//   nt: Normalized time in procentage (0.0 to 1.0) and is calculated by
		//       just dividing local time with duration of this effect.
		//   lt: Local time in milliseconds, from 0 to this.duration.
		//   gt: Global time in milliseconds,
		for (let i = 0; i < this.particleDataset.length; i++) {
			const yLimit = 550;

			var data = this.particleDataset[i];
			var sp = data.sp;
			//Apply coin animation
			let num = ("000" + Math.floor(nt * 8)).substr(-3);
			game.setTexture(sp, "CoinsGold" + num);

			//If it is out of bounds (like outside the view port), reset its position and alpha and randomize the particle's properties.
			if (sp.y >= yLimit) {
				sp.x = game.renderer.width / 2.0;
				sp.y = game.renderer.height / 2.0;
				sp.alpha = 0
				this.randomizeParticle(this.particleDataset[i]);
			}

			//Apply the fade amount in a slower scale.
			sp.alpha += fadeAmount / 100;
			//Make sure the alpha value doesnt go beyond 1.
			sp.alpha = Math.min(sp.alpha, 1)
			//Apply gravity
			sp.y += data.gravityAmount * 4.0;
			//Apply horizontal velocity
			sp.x += data.xVelocity;

			//Apply rotation in a slower scale.
			sp.rotation += data.rotation / 25;
			//Increment the gravity in a slower scale.
			data.gravityAmount += nt / 25;
		}

		// Set a new texture on a sprite particle
		// let num = ("000" + Math.floor(nt * 8)).substr(-3);
		// game.setTexture(this.sp, "CoinsGold" + num);
		// // Animate position
		// this.sp.x = 400;
		// this.sp.y = 225;
		// this.sp.x = 400 + nt*400;
		// this.sp.y = 225 + nt*225;
		// // Animate scale
		// this.sp.scale.x = this.sp.scale.y = nt;
		// // Animate alpha
		// this.sp.alpha = nt;
		// // Animate rotation
		// this.sp.rotation = nt*Math.PI*2;
	}

	//Randomize a particle's variables
	randomizeParticle(particleToRandomize) {
		//Randomize the gravity value and apply it to both the temporary and default value.
		let randomizedGravityValue = this.minMaxRandom(
			minGravityAmount,
			maxGravityAmount
		);
		
		//Apply new random values.
		particleToRandomize.defaultGravityAmount = randomizedGravityValue;
		particleToRandomize.gravityAmount = randomizedGravityValue;
		particleToRandomize.rotation = this.minMaxRandom(
			minRotationAmm,
			maxRotationAmm
		);
		particleToRandomize.xVelocity = this.minMaxRandom(
			minXVelocity,
			maxXVelocity
		);
	}

	minMaxRandom(min, max) {
		return Math.random() * (max - min) + min;
	}

	generateParticles(particleAmount) {
		let result = [];
		for (let i = 0; i < particleAmount; i++) {
			//create a sprite
			let sp = game.sprite(defaultSprite);
			// Set pivot to center of said sprite
			sp.pivot.x = sp.width / 2;
			sp.pivot.y = sp.height / 2;
			//Set a random size to said sprite
			sp.scale.x = sp.scale.y = this.minMaxRandom(minSize, maxSize);
			//Center the sprite to the middle of the screen
			sp.x = game.renderer.width / 2.0;
			sp.y = game.renderer.height / 2.0;
			//Make the sprite invisible
			sp.alpha = 0;
			// Add the sprite particle to our particle effect
			this.addChild(sp);
			// Get a randomized gravity value
			let randomizedGravityValue = this.minMaxRandom(
				minGravityAmount,
				maxGravityAmount
			);
			// Store a reference to the sprite particle as well as some randomn values to gravity and rotation.
			result.push({
				defaultGravityAmount: randomizedGravityValue, //Value where the gravity resets to
				gravityAmount: randomizedGravityValue, //temporary value
				sp: sp,
				rotation: this.minMaxRandom(minRotationAmm, maxRotationAmm), //Rotation Delta
				xVelocity: this.minMaxRandom(minXVelocity, maxXVelocity), //X Velocity
			});
		}
		//Return the references to the generated particles and their included information.
		return result;
	}
}

// ----- End of the assigment ----- //

class Game {
	constructor(props) {
		this.totalDuration = 0;
		this.effects = [];
		this.renderer = new PIXI.WebGLRenderer(800, 450);
		document.body.appendChild(this.renderer.view);
		this.stage = new PIXI.Container();
		this.loadAssets(props && props.onload);
	}
	loadAssets(cb) {
		let textureNames = [];
		// Load coin assets
		for (let i = 0; i <= 8; i++) {
			let num = ("000" + i).substr(-3);
			let name = "CoinsGold" + num;
			let url = "gfx/CoinsGold/" + num + ".png";
			textureNames.push(name);
			PIXI.loader.add(name, url);
		}
		PIXI.loader.load(
			function (loader, res) {
				// Access assets by name, not url
				let keys = Object.keys(res);
				for (let i = 0; i < keys.length; i++) {
					var texture = res[keys[i]].texture;
					if (!texture) continue;
					PIXI.utils.TextureCache[keys[i]] = texture;
				}
				// Assets are loaded and ready!
				this.start();
				cb && cb();
			}.bind(this)
		);
	}
	start() {
		this.isRunning = true;
		this.t0 = Date.now();
		update.bind(this)();
		function update() {
			if (!this.isRunning) return;
			this.tick();
			this.render();
			requestAnimationFrame(update.bind(this));
		}
	}
	addEffect(eff) {
		this.totalDuration = Math.max(
			this.totalDuration,
			eff.duration + eff.start || 0
		);
		this.effects.push(eff);
		this.stage.addChild(eff);
	}
	render() {
		this.renderer.render(this.stage);
	}
	tick() {
		let gt = Date.now();
		let lt = (gt - this.t0) % this.totalDuration;
		for (let i = 0; i < this.effects.length; i++) {
			let eff = this.effects[i];
			if (lt > eff.start + eff.duration || lt < eff.start) continue;
			let elt = lt - eff.start;
			let ent = elt / eff.duration;
			eff.animTick(ent, elt, gt);
		}
	}
	sprite(name) {
		return new PIXI.Sprite(PIXI.utils.TextureCache[name]);
	}
	setTexture(sp, name) {
		sp.texture = PIXI.utils.TextureCache[name];
		if (!sp.texture) console.warn("Texture '" + name + "' don't exist!");
	}
}

window.onload = function () {
	window.game = new Game({
		onload: function () {
			game.addEffect(new ParticleSystem());
		},
	});
};
