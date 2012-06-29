(function()
{
    ColorQuest.Enemy = function()
    {
        ColorQuest.Enemy.superclass.constructor.call(this);
        this.init("D");
        return this;
    };

    ColorQuest.Enemy.prototype =
    {

    };

    extend(ColorQuest.Enemy, ColorQuest.Character);

})();