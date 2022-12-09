/**
 * Contains lanes and a renderer to draw the Road to the screen
 */
 class Road {
    constructor(isActive, lanes) {
        this.isActive = isActive; // road Player is on
        
        // road curvature
        this.spline = new Array(Globals.world.renderDistance).fill(0);
        // this.spline = new Array(Globals.world.renderDistance).fill(0.5 * Globals.world.width);

        //initialize parameters
        this.id = GTC.newRoad(this);
        this.lanes = [];
        for (let i = 0; i < lanes; i++) {
            this.lanes.push(new Lane(this));
        }
        this.tiles = [];
        this.renderer = new RoadRenderer(this);
        this.center = Math.floor(lanes / 2) - 0.5;

        this.speedLimit = 0.06;
    }

    static FRICTION = -0.0002; // decelleration when pedals are released 

    /**
     * Renders the road to the display
     */
    render() {
        this.renderer.render();
    }

    /**
     * Updates road position and renderer
     */
    update() {
        const position = Globals.player.position;
        const garbage = Math.floor(position.mile - Globals.world.clipDistance);
        const insert = garbage + Globals.world.renderDistance;

        delete this.spline[garbage];
        this.spline[insert] = Math.max(0, Math.asin(Math.sin(position.mile / 10)) * 100);
        this.renderer.updateTiles();
    }

}

/**
 * Contains methods to render the road to the display
 */
class RoadRenderer {
    constructor(road) {
        this.road = road;
        this.roadContainer = new PIXI.Container();
        this.roadContainer.x = Globals.world.width * 0.5;
        this.roadContainer.y = Globals.world.height * 0.5;
        this.tiles = [];
        this.markers = [];

        this.road.lanes.forEach(lane => {
            this.tiles[lane.x] = [];
            for (let i = 0; i < Globals.world.renderDistance; i++) {
                let type = RenderTile.Types.CENTER;
                if (lane.x === 0 || lane.x === Math.ceil(road.center))
                    type = RenderTile.Types.LEFT_EDGE;
                if (lane.x === road.lanes.length - 1 || lane.x === Math.floor(road.center))
                    type = RenderTile.Types.RIGHT_EDGE;
                
                const tile = new RenderTile(lane.x, i, type);
                this.tiles[lane.x].push(tile);
            }
        })

        this.markers.push(new Sign(RoadMarker.Side.RIGHT, 4, Sign.Types.SPEED));
    }

    /**
     * loads in new tiles as they become visible and removes old ones after they're passed
     */
    updateTiles() {
        for (let lane = 0; lane < this.road.lanes.length; lane++) {
            const position = Globals.player.position;
            const garbage = Math.floor(position.mile - Globals.world.clipDistance);
            const insert = garbage + Globals.world.renderDistance;
            delete this.tiles[lane][garbage];

            let type = RenderTile.Types.CENTER;
                if (lane === 0 || lane === Math.ceil(this.road.center))
                    type = RenderTile.Types.LEFT_EDGE;
                if (lane === this.road.lanes.length - 1 || 
                    lane === Math.floor(this.road.center))
                    type = RenderTile.Types.RIGHT_EDGE;

            this.tiles[lane][insert] = new RenderTile(
                lane, 
                insert,
                type);
        }
    }

    /**
     * renders tiles to the display
     */
    render() {
        this.roadContainer.removeChildren(); // clear screen
        this.road.lanes.forEach(lane => {
            const mile = Math.floor(Globals.player.position.mile); 
            const tile = this.tiles[lane.x][mile];
            const s0 = this.road.spline[mile];

            // positions the first tile
            const dz = tile.mile - Globals.player.position.mile;
            const h = Globals.world.elevation;
            const y0 = _projY(Globals.world.elevation, dz);
            const x0 = s0 / h * (-y0 + h);

            const _tiles = [...this.tiles[lane.x].filter(t => t !== undefined)]; // sparse array 😃
            const _splines = [...this.road.spline.filter(s => s !== undefined)]; // sparse array 😃

            this._renderRecurse(_tiles, _splines, x0, y0);
        });

        this.markers.forEach(marker => {
            this.roadContainer.addChild(marker.sprite);

            const x = this.tiles[marker.lane * this.road.lanes.length][marker.mile].sprite.x * 
            (this.road.lanes.length + 1) / this.road.lanes.length; // outside lane
            
            const y = this.tiles[marker.lane][marker.mile].sprite.y;
            const dz = marker.mile - Globals.player.position.mile;

            marker.sprite.position = { x: x, y: y };

            const scale = Math.pow(0.5, dz);
            marker.sprite.scale.x *= scale;
            marker.sprite.scale.y *= scale;
        });
    }

    /**
     * Render each tile in a very cool 2.5d way
     * @param {RenderTile[]} tiles tiles to be rendered
     * @param {Number[]} splines direction of the road at each tile
     * @param {Number} x x position of the first tile
     * @param {Number} y y position of the first tile
     */
    _renderRecurse(tiles, splines, x, y) {
        if (tiles.length === 0) return; // escape recursion
        const tile = tiles.shift();
        const spline = splines.shift();

        tile.reload(); // initialize tile
        this.roadContainer.addChild(tile.sprite);

        const dx = tile.x - Globals.player.position.lane;
        const dz = tile.mile - Globals.player.position.mile;
        
        // position tile
        tile.sprite.x = _projX(Globals.world.width * dx, dz);
        tile.sprite.x += x;

        tile.sprite.y = y;

        // silly trigonometry
        const x0 = x;
        const y0 = y;
        x = 0.5 * (x + spline);
        y = 0.5 * y

        // prepping for shear
        const shear = (x - x0) / (y - y0);
        tile.sprite.shearX(4 * dx + shear);

        // scale is smaller as distance from camera increases
        const scale = Math.pow(0.5, dz);
        tile.sprite.scale.x *= scale;
        tile.sprite.scale.y *= scale;

        // render the remaining tiles
       this._renderRecurse(tiles, splines, x, y);
    }
}

/**
 * Contains all the data about a lane's personal (personal?) spline
 * that's about it actually
 */
class Lane {
    constructor(road) {
        this.spline;
        this.x = road.lanes.length;
        this.road = road.id;
        this.id = GTC.newLane(this);
    }    
}

/**
 * Contains states and methods for rending tiles
 */
class RenderTile {
    constructor(x, mile, type) {
        this.type = type;
        this.x = x;
        this.mile = mile;
        
        this.reload();
    }

    /**
     * resets the sprite so it can be used again
     */
    reload() {
        switch(this.type) {
            case RenderTile.Types.LEFT_EDGE:
                this.sprite = PIXI.Sprite.from('media/road_mask_transition.png');
                this.sprite.scale.x = -1;
                break;
            case RenderTile.Types.RIGHT_EDGE:
                this.sprite = PIXI.Sprite.from('media/road_mask_transition.png');
                break;
            default:
                this.sprite = PIXI.Sprite.from('media/road_mask_dashed.png');
        }

        this.sprite.anchor = { 'x': 0.5, 'y': 1 };
    }

    static Types = {
        LEFT_EDGE:  0,
        CENTER:     1,
        RIGHT_EDGE: 2
    }
}

class RoadMarker {
    constructor(lane, mile) {
        this.lane = lane;
        this.mile = mile;
    }

    render() {}

    static Side = {
        RIGHT:  1,
        LEFT:   0
    }
}

class Sign extends RoadMarker {
    constructor(lane, mile, type) {
        super(lane, mile);
        this.type = type;
        this.reload();
    }

    reload() {
        switch(this.type) {
            case Sign.Types.EXIT:
                this.sprite = new PIXI.Sprite.from("media/sign_arrowSign.png");
                break;
            case Sign.Types.SPEED:
                this.sprite = new PIXI.Sprite.from("media/sign_speedLimit.png");
            case Sign.Types.OVERHEAD:
                this.sprite = new PIXI.Sprite.from("media/sign_upperSign.png");
                break;
            default: return;
        }

        this.sprite.anchor = { x: 0.5, y: 1 };
    }

    static Types = {
        EXIT:       0,
        SPEED:      1,
        OVERHEAD:   2
    }
}

class MileMarker extends RoadMarker {
    constructor() {
        super();
        this.sprite = new PIXI.Sprite.from();
    }
}