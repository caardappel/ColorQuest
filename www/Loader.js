(function(exports){

function Loader()
{
}

Loader.prototype = 
{
    lDirector : null,

	preload : null,

    loadCallback : null,

	init : function(director, manifest, onComplete)
	{
        // setup
        var that = this;
        this.lDirector = director;

        // split manifest by file type
        var audioManifest = [];

        var filetype, aIdx, toRemove = [], i;
        for(i = 0; i < manifest.length; i++)
        {
            filetype = manifest[i].url.substring(manifest[i].url.length-3);
            if (filetype === "mp3" || filetype === "ogg")
            {
                aIdx = audioManifest.length;
                audioManifest[aIdx] = manifest[i];
                toRemove[aIdx] = i;
            }
        }
        for (i = toRemove.length-1; i >= 0; i--)
            manifest.splice(toRemove[i], 1);

        // Load
        this.loadCallback = onComplete;
        this.preload = new CAAT.ImagePreloader();

        this.preload.loadImages(manifest,
        function(counter, images)
        {
            if (counter == images.length)
            {
                that.lDirector.setImagesCache(images);
                that.loadAudio(audioManifest);
            }
        });
	},

    loadAudio : function(audioManifest)
    {
        for (var i = 0; i < audioManifest.length; i++)
            this.lDirector.addAudio(audioManifest[i].id, audioManifest[i].url);

        this.loadCallback();
    },

	getResult : function(id)
	{
		return this.lDirector.getImage(id);
	}
}

exports.Loader = Loader;

})(typeof exports === 'undefined'? _modules['Loader']={} : exports);