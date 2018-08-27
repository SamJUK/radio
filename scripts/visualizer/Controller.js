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

            var select = document.querySelector('select[name="visualizers"]');
            var vizkeys = Object.keys( controller.visualizers );
            for( var i = 0; i < vizkeys.length; i++ ) {
                var selected = vizkeys[i] === 'Iris' ? 'selected' : '';
                select.innerHTML += `<option value="${vizkeys[i]}" ${selected}>${vizkeys[i]}</option>`;
            }
        }
    }

    return controller;

}