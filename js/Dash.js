class Dash {
    // todo add shit
    static sprite = PIXI.Sprite.from('media/car_silhouette.png');
    
    static init() {
        Dash.sprite.anchor = {'x': 0.5, 'y': 0.5};
        Dash.sprite.x = 0.5 * Globals.world.width;
        Dash.sprite.y = 0.55 * Globals.world.height;
        Dash.sprite.scale = {'x': 1.25, 'y': 1.25};
    }

    // todo add other shit
    static render() {
        const player = Globals.player
        // backing image

        // speed
        const displaySpeed = Math.floor(player.speed * 1000);
        // const speedLabel = 

        // blinkers
        // set blinkers off

        // set left blinker
        if (player.blinker === -1);
        // set right blinker
        if (player.blinker === 1);


        // controls
        // sprite
        // controls label
        
    }
}