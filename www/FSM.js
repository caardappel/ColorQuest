(function(exports){

    function FSM()
    {
        this.current =  { name : '__none' };
        this.states = {};
    }

    FSM.prototype =
    {
        current : null,

        states : null,

        addState : function(id,onEnter,onTick,onLeave)
        {
            if (this.states[id])
                throw "state " + id + " already exists";

            this.states[id] =
            {
                name : id,
                enter : onEnter,
                tick : onTick,
                leave : onLeave
            }

        },

        gotoState : function(id)
        {
            // ignore state changes to ourself
            if (this.current.name == id)
                return;

            // find the requested state
            var newState = this.states[id];
            if (!newState)
                throw "unknown state: " + id;

            // call leave on current state
            if (this.current.leave)
                this.current.leave( newState.name );

            // remember exiting state name
            var oldStateName = this.current.name;
            console.log("FSM going from "+oldStateName+" to "+id);

            // switch to new state
            this.current = newState;
            if (this.current.enter)
                this.current.enter(oldStateName);
        },

        currentState : function()
        {
            return this.current.name;
        },

        removeState : function(id)
        {   // safety
            if (this.current.name == id)
            {
                console.log("Cannot remove currently active state!");
                return;
            }

            // remove if exists
            if (id in this.states)
            {
                delete this.states[id];
            }
        },

        stop : function()
        {
            this.current =  { name : '__none' };
        },

        tick : function(deltaTime)
        {
            if (this.current.tick)
            {
                this.current.tick(deltaTime);
                return true;
            }
            else
            {
                return false;
            }
        }
    }

    exports.FSM = FSM;


})(typeof exports === 'undefined'? _modules['FSM']={} : exports);