(function()
{
    ColorQuest.TestScene = function(director)
    {
        ColorQuest.TestScene.superclass.constructor.call(this);
        this.director = director;
        this.hackSetup();
        return this;
    };

    ColorQuest.TestScene.prototype =
    {
        director: null,

        player : null,
        enemy : null,

        hashMap : null,
        collTimer : null,

        hackSetup : function()
        {
            this.player = new ColorQuest.Player(this.director,this);
            this.addChild(this.player);

            this.enemy = new ColorQuest.Enemy(this.director,this);
            this.addChild(this.enemy);

            this.enemy.centerAt(200,200);
        }
    };

    extend(ColorQuest.TestScene, CAAT.Scene);

})();