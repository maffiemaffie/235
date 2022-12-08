/**
 * Main Car class. Applies to both player and AI cars.
 */
class Car {
    constructor(opts = {}) {
        // plate, position, speed, road, and neighbors
        for (const [key, value] of Object.entries(opts)) this[key] = value;
        // for (const [key, value] of Object.entries(GTC.greet(this))) this[key] = value;

        this.acceleration = 0;
        this.blinker = 0;
        this.brakes = false;
        this.changingLanes = 0;

        this.model = Car.Models.SEDAN; // TODO

        this.laneChangeOpts = {
            duration: 100,
            ease: 0.2
        }
    }

    static ACCELERATION = 0.001;
    static MAX_VELOCITY = 0.12;

    /**
     * Used by the GTC to relay information to each car about its surroundings
     * @returns Relevant data about each car.
     */
    getData() {
        return {
            position: this.position,
            speed: this.speed,
            acceleration: this.acceleration,
            road: this.road,
            blinker: this.blinker,
            brakes: this.brakes,
            changingLanes: this.changingLanes
        }
    }

    /**
     * Update the position of the Car
     */
    update() {
        this.position.mile += this.speed;
        this.speed = clamp(this.speed + this.acceleration, 0, Car.MAX_VELOCITY);

        if (this.changingLanes) {
            const fac = this.laneChange.factor(Globals.world.time);
            if (fac === -1) {
                this.laneChangeExit();
            } else {
                let start = this.position.lane;
                if (this.changingLanes === 1) start = Math.floor(start);
                else start = Math.ceil(start);

                this.position.lane = start + this.changingLanes * fac;
            }
        }
    }

    /**
     * Draw the car to the display
     */
    render() {
        // TODO draw car
    }

    /**
     * Initiate a lane change
     * @param {Number} direction 1 or -1, direction to change lanes to
     */
    laneChangeEnter(direction) {
        this.laneChange = new LaneChange(this.laneChangeOpts, Globals.world.time);
        this.changingLanes = direction;
    }

    /**
     * Complete a lane change and reset relevant states
     */
    laneChangeExit() {
        this.laneChange = null;
        this.changingLanes = 0;
        this.position.lane = Math.round(this.position.lane);

        this.blinker = 0;
        Controller.controlStates.BLINKER = 0;
    }

    /**
     * Used internally to make sure car isn't already switching lanes, has room to, has a lane to go to, etc.
     * @param {Number} direction 1 or -1, direction to change lanes to
     * @returns true if lane change is valid
     */
    _validateLaneChange(direction) {
        const thisLane = this.position.lane;
        const toLane = thisLane + direction;

        // only one lane change at a time
        if(this.changingLanes) return false;
        // cars can't cross the center
        if((thisLane > this.road.center && toLane < this.road.center) || 
        (thisLane < this.road.center && toLane > this.road.center)) return false;
        // cars can't drive off the edge of the road
        if((toLane < 0 || toLane >= this.road.lanes.length)) return false;

        // TODO don't collide with cars
        return true;
    }

    static Models = {
        SEDAN:  0,
        SUV:    1,
        TRUCK:  2
    };
}

/**
 * Class for the non-player cars
 */
class AICar extends Car {
    constructor(opts = {}) {
        super(opts);
    }

    update() {
        super.update();
    }

    render() {
        CarRenderer.render(this);
    }
}

/**
 * Player controlled car
 */
class Player extends Car {
    constructor(opts = {}) {
        super(opts);

        this.cruise = {
            incrementIndex: 0,
            decrementIndex: 0,
            enabled: false,
            speed: 0,
            interval: 0.005,
            displayInterval: 5
        }
    }

    update() {
        /******* CONTROLS *******/ 

        // changing lanes
        if (Controller.controlStates.MOVE_RIGHT && this._validateLaneChange(1))
            this.laneChangeEnter(1);
        if (Controller.controlStates.MOVE_LEFT && this._validateLaneChange(-1)) 
            this.laneChangeEnter(-1);

        // cruise control
        this.cruise.enabled = Controller.controlStates.CRUISE;
        if (this.cruise.enabled){
            const _direction = Math.sign(this.cruise.speed - this.speed);
            this.acceleration = _direction === 1 ? Car.ACCELERATION : Road.FRICTION;

            if (this.speed - this.cruise.speed < this.acceleration) this.speed = this.cruise.speed;
        } else {
            this.cruise.speed = this.speed;
            this.acceleration = Road.FRICTION;
        }
        if (Controller.controlStates.CRUISE_UP > this.cruise.incrementIndex) {
            this.cruise.speed = clamp(this.cruise.speed + this.cruise.interval, 0, Car.MAX_VELOCITY);
            this.cruise.incrementIndex++;
        }
        if (Controller.controlStates.CRUISE_DOWN > this.cruise.decrementIndex) {
            this.cruise.speed = clamp(this.cruise.speed - this.cruise.interval, 0, Car.MAX_VELOCITY);
            this.cruise.decrementIndex++;
        }

        // speed controls
        if (Controller.controlStates.ACCELLERATE)
            this.acceleration = Car.ACCELERATION;
        if (Controller.controlStates.DECELLERATE) {
            this.acceleration = -Car.ACCELERATION;
            this.cruise.enabled = false;
            Controller.controlStates.CRUISE = false;
        }

        // blinkers
        this.blinker = Controller.controlStates.blinker;

        // UPDATE
        super.update();
    }
}

/**
 * Contains states and methods necessary to enact lane changes
 */
class LaneChange {
    constructor(opts, start) {
        this.scale = 1 / opts.duration;
        this.ease = opts.ease;
        this.start = start;

        this._a = 1 / (-2 * this.ease * (this.ease - 1));
        this._m = (-2 * this._a * this.ease * this.ease + 1) / (1 - 2 * this.ease);
    }

    /**
     * Returns how much progress into the lane change has been made
     * @param {Number} time time since beginning of the application
     * @returns factor on [0, 1]
     */
    factor(time) {
        const t = (time - this.start) * this.scale;
        const a = this._a;
        const m = this._m;

        if (t < 0 || t > 1) return -1;
        if (t < this.ease) return a * t * t
        if (t < 1 - this.ease) return m * (t - 0.5) + 0.5;
        return -a * (t - 1) * (t - 1) + 1;
    }
}

class CarRenderer {
    static container = new PIXI.Container();

    static init() {
        CarRenderer.container.x = Globals.world.width * 0.5;
        CarRenderer.container.y = Globals.world.height * 0.5;
        CarRenderer.container.sortableChildren = true;
    }

    static refresh() {
        CarRenderer.container.removeChildren();
    }

    static render(car) {
        if (!car.road.renderer.tiles[car.position.lane][car.position.mile]) return;
        if (car.position.lane === Globals.player.position.lane) return;
        let sprite;

        switch(car.model) {
            case Car.Models.SEDAN:
                sprite = PIXI.Sprite.from('media/checker.png');
                break;
            case Car.Models.SUV:
                sprite = PIXI.Sprite.from('media/big-checker.png');
                break;
            case Car.Models.TRUCK:
                sprite = PIXI.Sprite.from('media/big-checker.png');
                break;
            default:
                return
        }

        const dz = car.position.mile - Globals.player.position.mile;

        sprite.anchor = { x: 0.5, y: 1 };

        sprite.position = car.road.renderer.tiles[car.position.lane][car.position.mile].sprite.position;
        sprite.zIndex = -dz

        const scale = 5 * Math.pow(0.5, dz);
        sprite.scale.x *= scale;
        sprite.scale.y *= scale;

        CarRenderer.container.addChild(sprite);
    }
}