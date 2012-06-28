(function()
{
    ColorQuest.TestScene = function()
    {
        CAAT.TestScene.superclass.constructor.call(this);
        this.hackSetup();
        return this;
    };

    ColorQuest.TestScene.prototype =
    {
        player : null,

        enemy : null,

        hackSetup : function()
        {
// too tired. stopping here
        }
    };

    extend(ColorQuest.TestScene, CAAT.Scene);

})();