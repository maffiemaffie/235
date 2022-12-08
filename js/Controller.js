class Controller {
    /** 
     * Collection of controls, types, and properties
     * 
     * HOLD: control maintains influence as long as it's active
     * TOGGLE: control toggles on and off, keyUp has no influence
     * CLICK: control fires every time activated, keyUp has no influence
     * TERNARY: control with a high, low, and neutral state. Uses 2 keys. Basically 2 toggles
     */
    static _setup = Object.freeze({
        MOVE_RIGHT: { code: 'ArrowRight', type: 'HOLD' },
        MOVE_LEFT: { code: 'ArrowLeft', type: 'HOLD' },
        ACCELLERATE: { code: 'ArrowUp', type: 'HOLD' },
        DECELLERATE: { code: 'ArrowDown', type: 'HOLD' },
        LEFT_BLINKER: { code: '[', type: 'TERNARY_DOWN', 'id': 'BLINKER' },
        RIGHT_BLINKER: { code: ']', type: 'TERNARY_UP', 'id': 'BLINKER' },
        CRUISE: { code: 'c', type: 'TOGGLE' },
        CRUISE_UP: { code: '=', type: 'CLICK' },
        CRUISE_DOWN: { code: '-', type: 'CLICK' }
    });

    // Actual keys up or down
    static _keyStates = {};
    // Value of each control
    static controlStates = {};
    // KeyboardEvent.key lookup table
    static _dictionary = {};

    /**
     * Set intialize _keyStates and controlStates; Compile dictionary
     */
    static init() {
        for(let [name, control] of Object.entries(Controller._setup)) {
            Controller._dictionary[control.code] = name;
            Controller._keyStates[name] = false;

            switch(control.type) {
                case 'HOLD':
                    Controller.controlStates[name] = false;
                    break;
                case 'TOGGLE':
                    Controller.controlStates[name] = false;
                    break;
                case 'TERNARY_UP':
                case 'TERNARY_DOWN':
                    Controller.controlStates[control.id] = 0;
                    break;
                case 'CLICK':
                    Controller.controlStates[name] = 0;
                    break;
                default:
            }
        }

        window.addEventListener('keydown', e => {
            // skip update if we don't care      
            if (Controller._dictionary[e.key] === undefined) return;

            const name = Controller._dictionary[e.key];

            // skip update if no change
            if(Controller._keyStates[name]) return;
        
            Controller._keyStates[name] = true;
            const control = Controller._setup[name];
            switch(control.type) {
                case 'HOLD':
                    Controller.controlStates[name] = true;
                    break;
                case 'TOGGLE':
                    Controller.controlStates[name] = !Controller.controlStates[name];
                    break;
                case 'TERNARY_UP':
                    if (Controller.controlStates[control.id] === 1) {
                        Controller.controlStates[control.id] = 0;
                        break;
                    }
                    Controller.controlStates[control.id] = 1;
                    break;
                case 'TERNARY_DOWN':
                    if (Controller.controlStates[control.id] === -1) {
                        Controller.controlStates[control.id] = 0;
                        break;
                    }
                    Controller.controlStates[control.id] = -1;
                    break;
                case 'CLICK':
                    Controller.controlStates[name]++;
                    break;
                default:
            }

            // don't do anything silly
            e.preventDefault();
        });
        
        window.addEventListener('keyup', e => {   
            // skip update if we don't care      
            if (Controller._dictionary[e.key] === undefined) return;

            const name = Controller._dictionary[e.key];

            // skip update if no change
            if(!Controller._keyStates[name]) return;
        
            Controller._keyStates[name] = false;
            const control = Controller._setup[name];
            switch(control.type) {
                case 'HOLD':
                    Controller.controlStates[name] = false;
                    break;
                default:
            }

            // don't do anything silly
            e.preventDefault();
        });
    }
}

