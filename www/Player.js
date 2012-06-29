(function()
{
    ColorQuest.Player = function(director,scene)
    {
        ColorQuest.Player.superclass.constructor.call(this,director,scene);
        this.init("@");
        CAAT.registerKeyListener(this._captureInput());
        return this;
    };

    ColorQuest.Player.MAX_SPEED = 10;

    ColorQuest.Player.prototype =
    {
        moveTimer : null,
        velocity : null,

        _captureInput : function()
        {
            if (!this.velocity)
                this.initializeMovement();

            var self = this;
            return function(keyEvent)
            {
                if (keyEvent.getKeyCode()===CAAT.Keys.UP)
                    self.accelerate(0,-1);
                if (keyEvent.getKeyCode()===CAAT.Keys.RIGHT)
                    self.accelerate(1,0);
                if (keyEvent.getKeyCode()===CAAT.Keys.DOWN)
                    self.accelerate(0,1);
                if (keyEvent.getKeyCode()===CAAT.Keys.LEFT)
                    self.accelerate(-1,0);

            }
        },

        initializeMovement : function()
        {
            var self = this;
            self.velocity = {x:0, y:0};
            self.vmax = ColorQuest.Player.MAX_SPEED;
            self.vmin = self.vmax * -1;

            var lastFrameTime = self.scene.time;
            var deltaTime = 0;
            self.moveTimer = this.scene.createTimer
                (   // Run timer from now until stopped
                    self.scene.time, Number.MAX_VALUE,
                    //timeout
                    null,
                    // tick
                    function(sceneTime, timerTaskTime, timerTask)
                    {   // delta time
                        if (sceneTime == lastFrameTime)
                            return;
                        deltaTime = (sceneTime - lastFrameTime) * 0.001;
                        lastFrameTime = sceneTime;

                        // apply motion
                        self.setPosition(self.x + self.velocity.x * deltaTime, self.y + self.velocity.y * deltaTime);

                        // apply friction
                        self.velocity.x += (self.velocity.x < 0 ? self.vmax : self.vmin) * deltaTime;
                        self.velocity.y += (self.velocity.y < 0 ? self.vmax : self.vmin) * deltaTime;

                    },
                    // cancel
                    null
                 );
        },

        accelerate : function(x,y)
        {
            this.velocity.x = Math.max(this.vmin, Math.min(this.vmax, this.velocity.x + x));
            this.velocity.y = Math.max(this.vmin, Math.min(this.vmax, this.velocity.y + y));
        }
    };

    extend(ColorQuest.Player, ColorQuest.Character);

})();