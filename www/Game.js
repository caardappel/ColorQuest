(function()
{   // Main Game
    ColorQuest.Game = function(onDevice)
    {   // Constructor
        this.initalized = true;
        this.onDevice = onDevice;

        // Fill the screen
        //NOTE: use window.innerWidth/Height when running on device.
        //TODO: find a better way to detect running on device to implement above NOTE:
        var width = 760;//window.innerWidth;
        var height = 600;//window.innerHeight;

        // create canvas and director
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        document.body.appendChild(this.canvas);

        this.director = new CAAT.Director().
            initialize(width, height, this.canvas);
        this.director.setSoundEffectsEnabled(!this.onDevice);

        var test = new ColorQuest.TestScene(this.director);
        this.director.addScene(test);

        this.director.setScene(0);
        CAAT.loop(30);

        return this;
    };

    // Constants

    // Prototpe
    ColorQuest.Game.prototype =
    {
        initalized : false,
        onDevice : false,

        canvas : null,
        director : null
    };

})();

// Global helpers
/*ColorQuest.getObjectClass = function(obj) {
    if (obj && obj.constructor && obj.constructor.toString) {
        var arr = obj.constructor.toString().match(
            /function\s*(\w+)/);

        if (arr && arr.length == 2) {
            return arr[1];
        }
    }

    return undefined;
};*/

// prevent dragging of content
document.addEventListener("touchmove", function(e){ e.preventDefault(); }, false);

// bootstrap functions for kicking of main initialization
function onBodyLoad()
{
    if (!window.cordova)
    {
        console.log('Cordova was not loaded');
        ColorQuest.game = new ColorQuest.Game(false);
    }
    else
    {   // Wait for the device to initalize
        document.addEventListener("deviceready",
            function()
            {
                console.log("Launching game on device");
                ColorQuest.game = new ColorQuest.Game(true);
            },
            false);

        // Fallback to "desktop" mode if the above fails
        window.setTimeout(
            function()
            {
                if (ColorQuest.game && !ColorQuest.Game.initalized)
                {
                    console.log("Launching game on desktop");
                    ColorQuest.game = new ColorQuest.Game(false);
                    //TODO: may be prudent to remove the deviceready event listener here
                }
            }, 125);

    }
}