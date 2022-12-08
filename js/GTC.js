/**
 * Ground Traffic Controller (think Air Traffic Controller for cars)
 * According to the FAA, "The primary purpose of the ATC system is 
 * to prevent a collision between aircraft operating in the system and 
 * to organize and expedite the flow of traffic"
 * so basically that
 */
class GTC {
    static cars = [];
    static lanes = [];
    static roads = [];
    static tiles = [];

    static plateIndex = -1;
    static laneIndex = -1;
    static roadIndex = -1;
    static greet(car) {
        ++GTC.plateIndex;
        let position;
        let road;
        // place car
        if(GTC.plateIndex === 0) { // is player
            position = { 'lane': 0, 'mile': 0 };
            road = GTC.roads[0];
        }
        // } else {
        //     position = {
        //         'lane': Math.floor(Math.random() * Globals.player.road.lanes.length),
        //         'mile': Globals.player.position.mile
        //     };
        //     road = Globals.player.road;
        // }

        // TODO add car to the listing
        GTC.cars[GTC.plateIndex] = {}
        GTC.cars[GTC.plateIndex].instance = car; // store the instance
        GTC.cars[GTC.plateIndex].tile = GTC._getTile(road.id, position); // log the car's tile
        GTC.cars[GTC.plateIndex].tile.enter(GTC.plateIndex); // inform the tile

        // TODO provide the car its initial properties
        return {
            'plate': GTC.plateIndex,
            'position': position,
            'speed': 60, // TODO standardize speeds
            'road': road,
            'neighbors': GTC._getNeighbors({'plate': GTC.plateIndex, 'road': road, 'position': position})
        }
    }

    static addCar(opts = {}) {
        const plate = ++GTC.plateIndex;
        const road = opts.road ?? GTC.roads[0];
        const speed =  opts.speed ?? road?.speedLimit ?? 0.06;
        const position = opts.position ?? {'lane': road.lanes.length - 1, 'mile': 0};
        const neighbors = GTC._getNeighbors({'plate': plate, 'road': road, 'position': position});

        GTC.cars[plate] = {}
        GTC.cars[plate].instance = new AICar({
            plate: plate,
            position: position,
            speed: speed,
            road: road,
            neighbors: neighbors
        });
        GTC.cars[plate].tile = GTC._getTile(road.id, position);
        GTC.cars[plate].tile.enter(plate);

        return GTC.cars[plate].instance;
    }

    static addPlayer() {
        const plate = ++GTC.plateIndex;
        if (plate > 0) return;

        const road = GTC.roads[0];
        const speed =  road?.speedLimit ?? 0.06;
        const position = { lane: road.lanes.length - 1, mile: 0 };
        const neighbors = GTC._getNeighbors({'plate': plate, 'road': road, 'position': position});

        GTC.cars[plate] = {}
        GTC.cars[plate].instance = new Player({
            plate: plate,
            position: position,
            speed: speed,
            road: road,
            neighbors: neighbors
        });
        GTC.cars[plate].tile = GTC._getTile(road.id, position);
        GTC.cars[plate].tile.enter(plate);

        return GTC.cars[plate].instance;
    }

    /**
     * Add road to GTC
     * @param {Road} road road
     * @returns the route number back to the Road
     */
    static newRoad(road) {
        ++GTC.roadIndex;
        GTC.tiles[GTC.roadIndex] = [];
        GTC.roads[GTC.roadIndex] = road;
        return GTC.roadIndex;
    }

    /**
     * Add lane to GTC
     * @param {Lane} lane lane
     * @returns lane index back to the Lane
     */
    static newLane(lane) {
        GTC.lanes[++GTC.laneIndex] = lane;
        GTC.tiles[lane.road][lane.x] = [];
        const playerPosition = Globals.player === null ? 0 : Globals.player.position.mile;
        for(let i = playerPosition; i < playerPosition + Globals.world.renderDistance; i++) {
            GTC.tiles[lane.road][lane.x][i] = new RoadTile(lane.x, i);
        }
        return GTC.laneIndex;
    }

    /**
     * Fired whenever a Car moves between tiles
     * If AI Car, just updates own and RoadTile data
     * If Player Car, updates scene
     * @param {Car} car car
     */
    static handoff(car) {
        car.tile.exit(car.instance.plate);
        GTC._getTile(car.instance.road.id, car.instance.position)?.enter(car.instance.plate);

        const road = car.instance.road;
        const roadID = road.id;
        const position = car.instance.position;

        const garbage = Math.floor(position.mile - Globals.world.clipDistance);
        const insert = garbage + Globals.world.renderDistance;

        if (car.instance.plate === 0) { // is player 
            for (let lane = 0; lane < GTC.lanes.length; lane++) {
                delete GTC.tiles[roadID][lane][garbage];
                GTC.tiles[roadID][lane][insert] = new RoadTile(lane, insert);

                if((insert + lane) % 3 === 0)
                GTC.addCar({
                    position: { 'lane': lane, 'mile': insert },
                    road: lane.road,
                    speed: 0.001
                });

                GTC.roads[roadID].update();
            }
        }
    }

    /**
     * locates the RoadTile at a given location
     * @param {Number} roadID road id
     * @param {Object} position position
     * @returns corresponding RoadTile
     */
    static _getTile(roadID, {'lane': lane, 'mile': mile}) {
        const _lane = Math.floor(lane);
        const _mile = Math.floor(mile);

        if(GTC.tiles[roadID] && GTC.tiles[roadID][_lane] && GTC.tiles[roadID][_lane][_mile])
            return GTC.tiles[roadID][_lane][_mile];
        return null;
    }

    /**
     * Extracts the Cars from a given tile.
     * @param {Number} roadID road id
     * @param {Number} lane lane position
     * @param {Number} mile mile position
     * @returns an array of Cars
     */
    static _getTileContent(roadID, lane, mile) {
        const tile = GTC._getTile(roadID, {'lane': lane, 'mile': mile});
        if (tile === null) return []
        return tile.Cars().map(id => GTC.cars[id].instance.getData());
    }

    /**
     * Takes a Car and locates its neighboring tiles
     * @param {Car} car car
     * @returns an array of RoadTiles
     */
    static _getNeighbors(car) {
        const ret = [];
        const [lane, mile] = Object.values(car.position);

        for (let laneOffset = -1; laneOffset <= 1; laneOffset++) {
            for (let mileOffset = -1; mileOffset <= 1; mileOffset++) {
                ret.push(...GTC._getTileContent(car.road.id, lane + laneOffset, mile + mileOffset));
            }
        }

        return ret;
    }

    /**
     * Update each Car by calling its update method
     * If car has left its RoadTile, update tiles and GTC data accordingly
     */
    static update() {
        CarRenderer.refresh();

        GTC.cars.forEach(car => {
            // TODO do stuff
            car.instance.update();
            if(!car.tile.isInside(car.instance.position.lane, car.instance.position.mile)) {
                GTC.handoff(car);
            }
            car.instance.render();
        });
    }
}

/**
 * Stores data about its own location and the cars inside it
 */
class RoadTile {
    constructor(lane, mile) {
        this.lane = lane;
        this.mile = mile;
        this._cars = [];
    }

    /**
     * Checks if a position is inside this tile
     * @param {Number} lane lane position
     * @param {Number} mile mile position
     * @returns whether the position is inside this tile
     */
    isInside(lane, mile) {
        return (Math.round(lane) === this.lane && Math.floor(mile) === this.mile);
    }

    /**
     * Adds a car to the tile
     * @param {Number} id car plate number
     */
    enter(id) {
        this._cars.push(id);
    }

    /**
     * Removes a car from the tile
     * @param {Nunber} id car plate number
     */
    exit(id) {
        const index = this._cars.indexOf(id);
        if (index === -1) return;
        this._cars.splice(index, 1);
    }

    /**
     * gets the ids of each car currently in the tile
     * @returns an array of ids
     */
    Cars() {
        return [...this._cars];
    }
}