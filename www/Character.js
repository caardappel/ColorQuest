(function()
{
    ColorQuest.Character = function(director,scene)
    {
        ColorQuest.Character.superclass.constructor.call(this);
        this.director = director;
        this.scene = scene;
        return this;
    };

    ColorQuest.Character.prototype =
    {
        director: null,
        scene: null,

        color: null,

        init : function(c)
        {   // NOTE: text representation is likely temporary
            var char = c||"D";

            this.color = new CAAT.Color.RGB(128,128,128);

            this.setBounds(100,100,ColorQuest.World.TILE_SIZE,ColorQuest.World.TILE_SIZE);
            this.addChild
                (
                    new CAAT.ShapeActor().
                        setAlpha(0.33).
                        setBounds(0,0,this.width,this.height)
                ).
                addChild
                (
                    new CAAT.TextActor().
                        setFont('16px Arial bold').
                        setText(char).
                        setBaseline("top").
                        setTextAlign("center").
                        centerAt(this.width*0.5,(this.height*0.5))
                );

            this.cacheAsBitmap();
            this.updateColor(128,128,128);
        },

        updateColor : function(r,g,b)
        {
            this.color.r = r||this.color.r;
            this.color.g = g||this.color.g;
            this.color.b = b||this.color.b;

            var h = this.color.toHex();
            var c;
            for (var i = 0; i < this.childrenList.length; i++)
            {
                c = this.childrenList[i];
                if ('font' in c)
                    c.setTextFillStyle(h);
                else
                    c.setFillStyle(h);
            }
        }
    };

    extend(ColorQuest.Character, CAAT.ActorContainer);

})();