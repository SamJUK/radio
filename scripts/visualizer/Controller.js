function Controller() {

    var analyser;
    var view;
    var scene;

    var controller = {
        visualizers: {
            'Hill Fog': new HillFog(),
            'Barred': new Barred(),
            'Tricentric': new Tricentric(),
            'Iris': new Iris(),
            'Fracture': new Fracture(),
            'Siphon': new Siphon(),
            'Silk': new Silk()
        },
        activeViz: null,
        init: function( AudioAnalyser, View ) {
            analyser = AudioAnalyser;
            view = View;
            scene = View.scene;
        }
    }

    return controller;

}