(function(exports){

    function ScrollView()
    {
        return this;
    }

    ScrollView.prototype =
    {
        ////////////////////////////////////////
        // CONSTANTS
        // DO NOT modify these programatically
        ScrollStates :
        {
            InputDown       : 'id',

            FreeScrollUp    : 'su',
            FreeScrollDown  : 'sd',
            ReturnToTop     : 'rt',
            ReturnToBottom  : 'rd',

            NotMoving       : 'nm'
        },
        maxOverScroll : 50,
        bounceRange : 200,

        returnSpeed : 15.0,
        decelDamp : 200.0,
        bounceDamp : 500.0,
        velMax : 500.0,
        clampDist : 2.5,
        ////////////////////////////////////////

        director : null,
        ownerScene : null,

        clipArea : null,
        fill : null,
        scrollContainer : null,
        offset :
        {
            x : 0, y : 0
        },

        scrollTimer : null,
        lastFrameTime : 0,

        fsmH : null,
        fsmV : null,

        velocity :
        {
            x : 0, y : 0
        },
        lastPosition :
        {
            x : 0, y : 0
        },
        input :
        {
            x : 0, y : 0
        },
        min :
        {
            x : 0, y : 0
        },
        minOverScroll :
        {
            x : 0, y : 0
        },

        clickCallback : null,
        lastClickedIdx : -1,

        init : function(x, y, width, height, director, scene, clickCallback, colorfill)
        {
            var self = this;

            self.cleanup();

            self.offset.x = 0;
            self.offset.y = 0;
            self.ownerScene = scene;
            self.director = director;
            self.clickCallback = clickCallback;

            self.clipArea = new CAAT.ActorContainer().
                setBounds(x,y,width,height).
                setClip(true).
                cacheAsBitmap();

            self.scrollContainer = new CAAT.ActorContainer().
                setBounds(0,0,width,height).
                cacheAsBitmap();

            self.fill = new CAAT.ShapeActor().
                setShape(CAAT.ShapeActor.prototype.SHAPE_RECTANGLE).
                setFillStyle(colorfill||(new CAAT.Color.RGB(128,128,128)).toHex()).
                setBounds(0,0,width,height).
                enableEvents(false).
                cacheAsBitmap();

            self.clipArea.addChild(self.fill);
            self.clipArea.addChild(self.scrollContainer);
            scene.addChild(self.clipArea);

            //if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/))
            if (false)//CAAT.TOUCH_BEHAVIOR === CAAT.TOUCH_AS_MULTITOUCH)
            {
                self.scrollContainer.touchStart = self._InputDown(true);
                self.scrollContainer.touchMove = self._captureMove(true);
                self.scrollContainer.touchEnd = self._InputUp();
            }
            else
            {
                self.scrollContainer.mouseDown = self._InputDown(false);
                self.scrollContainer.mouseDrag = self._captureMove(false);
                self.scrollContainer.mouseUp = self._InputUp();

                self.scrollContainer.mouseClick = self._scrollClick();
            }

            self.buildStates();
            self.startTimer();

            return self;
        },

        addActorH : function(actor, padding)
        {
            var self = this;

            self.scrollContainer.addChild(actor);
            actor.setPosition(self.offset.x, (self.scrollContainer.height - actor.height) * 0.5).
                enableEvents(false);

            self.offset.x += actor.width+ padding||0;
            self.scrollContainer.setBounds(0,0,self.offset.x,self.scrollContainer.height);

            self.min.x = (self.scrollContainer.width - self.clipArea.width) * -1;
            self.minOverScroll.x = self.min.x - self.maxOverScroll;

            self.fsmH.gotoState(self.ScrollStates.NotMoving);

            return self;
        },

        addActorV : function(actor, padding)
        {
            var self = this;

            self.scrollContainer.addChild(actor);
            actor.setPosition((self.scrollContainer.width - actor.width) * 0.5, self.offset.y).
                enableEvents(false);

            self.offset.y += actor.height + padding||0;
            self.scrollContainer.setBounds(0,0,self.scrollContainer.width, self.offset.y);

            self.min.y = (self.scrollContainer.height - self.clipArea.height) * -1;
            self.minOverScroll.y = self.min.y - self.maxOverScroll;

            self.fsmV.gotoState(self.ScrollStates.NotMoving);

            return self;
        },

        ////////////////////////////////////////////////////////
        // Scroll states

        _InputDown : function (touchAsInput)
        {
            var self = this;

            //console.log("creating scrolldown with "+(touchAsInput?"touch input":"mouse input"));
            return function(event)
            {
                if (touchAsInput)
                {
                    self.input.x = event.clientX;
                    self.input.y = event.clientY;
                }
                else
                {
                    self.input.x = event.x;
                    self.input.y = event.y;
                }
                self.lastPosition.x = self.input.x;
                self.lastPosition.y = self.input.y;

                self.velocity.x = 0;
                self.velocity.y = 0;
                if (self.offset.x > 0 && self.fsmH.currentState() !== self.ScrollStates.InputDown)
                    self.fsmH.gotoState(self.ScrollStates.InputDown);
                if (self.offset.y > 0 && self.fsmV.currentState() !== self.ScrollStates.InputDown)
                    self.fsmV.gotoState(self.ScrollStates.InputDown);
            }
        },

        _InputUp : function ()
        {
            var self = this;

            return function()
            {
                if (self.offset.x > 0)
                {
                    if (self.velocity.x < 0)
                        self.fsmH.gotoState(self.ScrollStates.FreeScrollDown);
                    else
                        self.fsmH.gotoState(self.ScrollStates.FreeScrollUp);
                }
                if (self.offset.y > 0)
                {
                    if (self.velocity.y < 0)
                        self.fsmV.gotoState(self.ScrollStates.FreeScrollDown);
                    else
                        self.fsmV.gotoState(self.ScrollStates.FreeScrollUp);
                }
            }
        },

        InputMove : function (newX, newY)
        {
            //console.log("MouseMove");
            var self = this;

            self.input.x = newX;
            self.input.y = newY;
        },

        _inputIsDown : function(idx)
        {
            var self = this;
            var delta = 0, rebound = 0, pos = 0;
            return function(deltaTime)
            {   // Just Move
                delta = self.input[idx] - self.lastPosition[idx];
                self.lastPosition[idx] = self.input[idx];
                if (delta == 0)
                    return;

                self.velocity[idx] = delta / deltaTime;

                // Prevent overscroll
                pos = idx === 'x' ? self.scrollContainer.x :self.scrollContainer.y;// TODO: Test setup once
                if (pos < self.minOverScroll[idx] ||
                    pos > self.maxOverScroll[idx])
                {
                    rebound = Math.abs(pos > 0 ? pos :
                              Math.abs(self.minOverScroll[idx]-pos));
                    self.velocity[idx] *= 1.0 - rebound / self.bounceRange;
                }

                self.scrollUpdate(deltaTime);
            }
        },

        _freeScrollUp : function(idx)
        {
            var self = this;
            var damp = 0, pos = 0;
            return function(deltaTime)
            {
                if (self.velocity[idx] === 0)
                    return;

                damp = self.decelDamp * deltaTime;
                pos = idx === 'x' ? self.scrollContainer.x :self.scrollContainer.y;

                self.velocity[idx] = Math.max((self.velMax*-1), Math.min(self.velMax, self.velocity[idx] - damp));
                if (Math.abs(self.velocityY) < damp)
                    self.velocityY = 0;

                if (pos > self.maxOverScroll[idx])
                {
                    self.velocity[idx] = (pos * self.returnSpeed) * deltaTime * -1;
                    if (idx === 'x')
                        self.fsmH.gotoState(self.ScrollStates.ReturnToTop);
                    else
                        self.fsmV.gotoState(self.ScrollStates.ReturnToTop);
                }

                self.scrollUpdate(deltaTime);
            };
        },

        _freeScrollDown : function(idx)
        {
            var self = this;
            var damp = 0, pos = 0;
            return function(deltaTime)
            {
                if (self.velocity[idx] === 0)
                    return;

                damp = self.decelDamp * deltaTime;
                pos = idx === 'x' ? self.scrollContainer.x :self.scrollContainer.y;

                self.velocity[idx] = Math.max((self.velMax*-1), Math.min(self.velMax, self.velocity[idx] + damp));
                if (Math.abs(self.velocity[idx]) < damp)
                    self.velocity[idx] = 0;
                if (pos < self.minOverScroll[idx])
                {
                    self.velocity[idx] = (self.min[idx] - pos) * self.returnSpeed * deltaTime;
                    if (idx === 'x')
                        self.fsmH.gotoState(self.ScrollStates.ReturnToBottom);
                    else
                        self.fsmV.gotoState(self.ScrollStates.ReturnToBottom);
                }

                self.scrollUpdate(deltaTime);
            };
        },

        _returnToTop : function(idx)
        {
            var self = this;
            var pos = 0;
            return function(deltaTime)
            {
                pos = idx === 'x' ? self.scrollContainer.x :self.scrollContainer.y;

                self.velocity[idx] = (pos * self.returnSpeed) * deltaTime * -1;
                self.scrollUpdate(deltaTime);

                if (Math.abs(pos) <= self.clampDist)
                {
                    self.pos = 0;
                    self.velocity[idx] = 0;
                    if (idx === 'x')
                        self.fsmH.gotoState(self.ScrollStates.NotMoving);
                    else
                        self.fsmV.gotoState(self.ScrollStates.NotMoving);
                }
            };
        },

        _returnToBottom : function(idx)
        {
            var self = this;
            var pos = 0;
            return function(deltaTime)
            {
                pos = idx === 'x' ? self.scrollContainer.x :self.scrollContainer.y;

                self.velocity[idx] = (self.min[idx] - pos) * self.returnSpeed * deltaTime;
                self.scrollUpdate(deltaTime);

                if (Math.abs(self.min[idx] - pos) <= self.clampDist)
                {
                    pos = self.min[idx];
                    self.velocity[idx] = 0;
                    if (idx === 'x')
                        self.fsmH.gotoState(self.ScrollStates.NotMoving);
                    else
                        self.fsmV.gotoState(self.ScrollStates.NotMoving);
                }
            };
        },

        _scrollTick : function()
        {
            var self = this;

            var deltaTime = 0.0;
            return function(sceneTime, timerTaskTime, timerTask)
            {   // delta time
                if (sceneTime == self.lastFrameTime)
                    return;
                deltaTime = (sceneTime - self.lastFrameTime) * 0.001;
                self.lastFrameTime = sceneTime;

                //console.log(self.fsmH.currentState());
                //console.log(self.fsmV.currentState());

                self.fsmH.tick(deltaTime);
                self.fsmV.tick(deltaTime);
            }
        },

        _scrollClick : function()
        {
            var self = this;

            return function(event)
            {
                if (self.clickCallback != null)
                {
                    var clickIdx = self.findActorByY(event.y);
                    self.clickCallback(clickIdx > -1 ? self.scrollContainer.getChildAt(clickIdx) : null,
                        self.lastClickedIdx > -1 ? self.scrollContainer.getChildAt(self.lastClickedIdx) : null);
                    if (clickIdx != -1)
                        self.lastClickedIdx = clickIdx;
                }
            }
        },

        ////////////////////////////////////////////////////////
        // Helpers

        buildStates : function()
        {
            var self = this;

            if (self.fsmH || self.fsmV)
                return;

            var FSM = require('FSM').FSM;
            self.fsmH = new FSM();
            self.fsmV = new FSM();

            self.fsmH.addState(self.ScrollStates.InputDown,
                null,   //enter
                self._inputIsDown('x'),   // tick
                null    // leave
            );

            self.fsmV.addState(self.ScrollStates.InputDown,
                null,   //enter
                self._inputIsDown('y'),   // tick
                null    // leave
            );

            self.fsmH.addState(self.ScrollStates.FreeScrollUp,
                null,   //enter
                self._freeScrollUp('x'),   // tick
                null    // leave
            );

            self.fsmV.addState(self.ScrollStates.FreeScrollUp,
                null,   //enter
                self._freeScrollUp('y'),   // tick
                null    // leave
            );

            self.fsmH.addState(self.ScrollStates.FreeScrollDown,
                null,   //enter
                self._freeScrollDown('x'),   // tick
                null    // leave
            );

            self.fsmV.addState(self.ScrollStates.FreeScrollDown,
                null,   //enter
                self._freeScrollDown('y'),   // tick
                null    // leave
            );

            self.fsmH.addState(self.ScrollStates.ReturnToTop,
                null,   //enter
                self._returnToTop('x'),   // tick
                null    // leave
            );

            self.fsmV.addState(self.ScrollStates.ReturnToTop,
                null,   //enter
                self._returnToTop('y'),   // tick
                null    // leave
            );

            self.fsmH.addState(self.ScrollStates.ReturnToBottom,
                null,   //enter
                self._returnToBottom('x'),   // tick
                null    // leave
            );

            self.fsmV.addState(self.ScrollStates.ReturnToBottom,
                null,   //enter
                self._returnToBottom('y'),   // tick
                null    // leave
            );

            self.fsmH.addState(self.ScrollStates.NotMoving,
                null,   //enter
                null,   // tick
                null    // leave
            );

            self.fsmV.addState(self.ScrollStates.NotMoving,
                null,   //enter
                null,   // tick
                null    // leave
            );
        },

        cleanup : function()
        {
            var self = this;

            if (self.scrollTimer)
                self.stopTimer();
            if (self.fsmH)
                self.fsmH.stop();
            if (self.fsmV)
                self.fsmV.stop();

            if (self.clipArea !== null)
            {
                self.ownerScene.removeChild(self.clipArea);

                self.clipArea.setParent(null);
                self.clipArea.emptyChildren();
                self.clipArea.setExpired(true);
                self.clipArea.setDiscardable(true);
            }

            if (self.scrollContainer !== null)
            {
                for (var i = 0; i < self.scrollContainer.childrenList.length; i++)
                {
                    self.scrollContainer.getChildAt(i).setExpired(true);
                    self.scrollContainer.getChildAt(i).setDiscardable(true);
                    self.scrollContainer.getChildAt(i).setParent(null);
                }

                self.scrollContainer.setParent(null);
                self.scrollContainer.emptyChildren();
                self.scrollContainer.setExpired(true);
                self.scrollContainer.setDiscardable(true);
            }

            if (self.fill !== null)
            {
                self.fill.setParent(null);
                self.fill.setExpired(true);
                self.fill.setDiscardable(true);
            }

            self.clipArea = null;
            self.scrollContainer = null;
            self.fill = null;

            self.ownerScene = null;
            self.director = null;
            self.clickCallback = null;
        },

        scrollUpdate : function(deltaTime)
        {
            var self = this;

            // Update position
            //console.log(self.velocity.y);
            self.scrollContainer.setPosition
                (
                    self.scrollContainer.x + self.velocity.x * deltaTime,
                    self.scrollContainer.y + self.velocity.y * deltaTime
                );
        },

        startTimer : function()
        {
            var self = this;

            self.lastFrameTime = self.ownerScene.time;
            self.scrollTimer = self.ownerScene.createTimer
                (
                    self.ownerScene.time,
                    Number.MAX_VALUE,
                    null,               // timeout
                    self._scrollTick(), // tick
                    null                // cancel
                );
        },

        stopTimer : function()
        {
            var self = this;
            self.scrollTimer.cancel();
            self.scrollTimer = null;
        },

        _captureMove : function(touchAsInput)
        {
            var self = this;

            if (touchAsInput)
            {
                return function(touchEvent)
                {
                    //console.log(touchEvent);
                    self.InputMove(touchEvent.clientX, touchEvent.clientY);
                }
            }
            else
            {
                return function(mouseEvent)
                {
                    //console.log(mouseEvent);
                    self.InputMove(mouseEvent.x, mouseEvent.y);
                }
            }
        },

        findActorByY : function(yPos)
        {
            var self = this;

            var actor = null;
            for (var i = 0; i < self.scrollContainer.childrenList.length; i++)
            {
                actor = self.scrollContainer.getChildAt(i);
                //console.log("actor at " + actor.y + " with height " + actor.height + " vs input at " + yPos);
                if (yPos >= actor.y && yPos <= (actor.y + actor.height))
                    return i;
            }
            return -1;
        }
    }
    exports.ScrollView = ScrollView;

})(typeof exports === 'undefined'? _modules['ScrollView']={} : exports);