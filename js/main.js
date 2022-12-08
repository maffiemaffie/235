window.addEventListener('load', init);

let Globals;

function init() {
    Globals = {
    'player': null,
    'world': {
        'time': 0.0,
        'width': 640,
        'height': 320,
        'elevation': 160,
        'renderDistance': 8,
        'clipDistance': 1
        }
    };

    Controller.init();
    main();
}

function main() {
    const app = new PIXI.Application({ width: Globals.world.width, height: Globals.world.height });
    document.body.appendChild(app.view);

    const sky = new PIXI.Graphics();
    sky.beginFill(0xe0e1d8);
    sky.lineStyle({ width: 0, alignment: 0 });
    sky.drawRect(0, 0, Globals.world.width, Globals.world.height);
    app.stage.addChild(sky);
    
    const ground = new PIXI.Graphics();
    ground.beginFill(0x999ba4);
    ground.lineStyle({ width: 0, alignment: 0 });
    ground.drawRect(0, Globals.world.height * 0.5, Globals.world.width, Globals.world.height);
    app.stage.addChild(ground);

    const road = new Road(true, 4);
    Globals.player = GTC.addPlayer();

    app.stage.addChild(road.renderer.roadContainer);
    road.render();

    CarRenderer.init();
    app.stage.addChild(CarRenderer.container);

    Dash.init();
    app.stage.addChild(Dash.sprite);

    app.ticker.add(delta => {
        Globals.world.time += delta;
        GTC.update();
        road.render();
    });

}