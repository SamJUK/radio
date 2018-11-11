let stations = [];
let volumeBeforeMute = 1;
let hlsTypes = ['m3u8'];
let hls = new Hls();

let current_type = 1; // 1 = AUDIO | 2 = VIDEO
let current_track = 1; // CURRENT AUDIO TRACK
let current_hls_track = 1; // CURRENT HLS TRACK

let current_bg = 1; // 0 = None | 1 = Image | 2 = Visualizer

let base_page_title = '';

// On Load
function onload() {

    // Load Stations
    LoadStations();

    SetUpVolumeSlider();

    $('#background').hide();

    setTimeout(function() {
        $('#background').fadeIn();
    }, 100);

    // Setup HLS
    HLSErrorHandling();

    setUpTracks();

    setupVisualizer();

    base_page_title = document.querySelector('title').innerText;
}

if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onload);
} else {
    onload();
}

function setUpTracks(){
    $('audio').on('playing', function(){
        console.log('Stoping Track'+current_track);
        let current_track_id = current_type === 1
            ? `stationAudioTrack${current_track}`
            : `HLSStationAudioTrack${current_hls_track}`;

        let current_track_element = document.getElementById(current_track_id);

        let new_track_int = current_track === 1 ? 2 : 1;
        let new_track_id = current_type === 1
            ? `stationAudioTrack${new_track_int}`
            : `HLSStationAudioTrack${new_track_int}`;

        let new_track_element = document.getElementById(new_track_id);

        let vol = Math.min(Math.max(current_track_element.volume / 10, 0), 1);

        let fade = setInterval(function(){
            current_track_element.volume -= vol;
            new_track_element.volume += vol;
        }, 100);

        setTimeout(function(){
            current_track_element.pause();

            if(current_type === 1) {
                current_track = current_track === 1 ? 2 : 1;
            }else{
                current_hls_track = current_hls_track === 1 ? 2 : 1;
            }

            clearInterval(fade);
            console.log('Track Stopped');
        }, 1000);
    });
}

function LoadStations()
{
    ajaxGet('data/stations.json', data => {
        stations = JSON.parse(data);
        populateStationsDataList();

        // Continue from last visit if available
        ContinueFromLastVisit();
    });
}

function populateStationsDataList()
{
    let html = '';
    let i = 0;
    stations.forEach( station => {
        html += `
        <option value='${station.DisplayName}'
            data-id='${i}'>
        `;
        i++;
    });
    document.getElementById('stationsDataList').innerHTML = html;
}

function onStationModelOpen()
{
    clearStationModel();
    autoFocusStationModel();
}

function clearStationModel()
{
    document.getElementById('stationSelector').value = '';
}

function autoFocusStationModel()
{
    $('#stationModel').on('shown.bs.modal', function () {
        $('#stationSelector').focus()
    });
}

function stationSelectorKeyHandler(event)
{
    // keyCode 13 - Enter
    switch (event.keyCode) {
        case 13:
            modelStationSelected();
            break;
    }
}

function muteToggle()
{
    const mute_element = document.getElementById('mute');
    const volume_element = document.getElementById('VolumeSlider');
    const track_element = document.getElementById(`stationAudioTrack${current_track}`);

    if (mute_element.classList.contains('muted'))
    {
        mute_element.classList.remove('muted');
        volume_element.classList.remove('disabled');
        track_element.volume = volumeBeforeMute;
    } else {
        mute_element.classList.add('muted');
        volume_element.classList.add('disabled');
        volumeBeforeMute = track_element.volume;
        track_element.volume = 0;
    }

    docCookies.setItem( 'audio_volume', track_element.volume );
}

function modelStationSelected()
{
    const station_input_value = document.getElementById('stationSelector').value;
    const station_datalist_option = document.querySelector(`#stationsDataList option[value='${station_input_value}']`);
    const errors_container = document.getElementById('errors');

    // Does not exist
    if (station_datalist_option === null)
    {
        const childCount = $('errors').children().length;
        const errorTemplate = `
            <div id="error${childCount}" class="alert alert-danger alert-dismissible fade show" role="alert" data-dismiss="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <strong>Oh No!</strong> That station does not exist!
            </div>
        `;

        errors_container.innerHTML += errorTemplate;
        setTimeout( id => {
            document.getElementById(`error${id}`).remove();
        }, 3000, [childCount]);

        return;
    }

    let stationID = station_datalist_option.getAttribute('data-id');
    changeStation(stationID);
    $('#stationModel').modal('toggle');
}

function changeStation (id)
{
    let stationURL = stations[id].audioURL;
    let stationName = stations[id].DisplayName;

    document.getElementById('stationName').innerText = stationName;
    updateStationAudio(stationURL);

    docCookies.setItem( 'station_id', id );
    document.querySelector('title').innerText = `${base_page_title} - ${stationName}`;
}

function updateStationAudio(stationurl)
{
    var track = current_track === 2 ? 1 : 2;
    let new_audio = document.getElementById(`stationAudioTrack${track}`);

    let split = stationurl.split('.');
    let ext = split[split.length - 1];

    if(hlsTypes.indexOf(ext) !== -1){
        console.log('Playing HLS stream');
        playHLS(stationurl);
        return;
    }

    // Regular Audio
    console.log('Playing Audio Stream');

    hls.destroy();
    console.log('Starting Track: '+track);
    new_audio.setAttribute('src', stationurl);
    new_audio.volume = 0;
    new_audio.play();

    if(current_bg === 2) {
        init_visualiser(track);
    }
}

function playHLS(stationurl)
{
    if (Hls.isSupported()) {
        let track = current_hls_track === 2 ? 1 : 2;
        let new_video = document.getElementById(`HLSStationAudioTrack${track}`);

        hls.destroy();
        hls = new Hls();

        hls.attachMedia(new_video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls.loadSource(stationurl);
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                new_video.volume = 0;
                new_video.play();
            });
        });
    }
}

function HLSErrorHandling()
{
    hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
            switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    // try to recover network error
                    console.log("fatal network error encountered, try to recover");
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("fatal media error encountered, try to recover");
                    hls.recoverMediaError();
                    break;
                default:
                    // cannot recover
                    console.log('fatal error, cannot recover so destroying self!');
                    hls.destroy();
                    break;
            }
        }
    });
}

function SetUpVolumeSlider()
{
    $( "#VolumeSlider" ).slider({
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: 100,
      value: 90,
      slide: function( event, ui ) {
        document.getElementById(`stationAudioTrack${current_track}`).volume = ui.value/100;
        docCookies.setItem( 'audio_volume', ui.value/100 );
      }
    });
}

function ajaxGet(page, callback)
{
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            callback(this.responseText);
        }
    };
    xhttp.open("GET", page, true);
    xhttp.send();
}

function ContinueFromLastVisit()
{
    var station = docCookies.getItem('station_id');
    var volume = docCookies.getItem('audio_volume');

    if(station !== null && stations[parseInt(station)]) {
        changeStation(parseInt(station));
    }

    var floatVol = parseFloat(volume);
    if(volume && !isNaN(floatVol) && (floatVol >= 0 && floatVol <= 1)) {
        document.getElementById(`stationAudioTrack${current_track}`).volume = floatVol;
        $( "#VolumeSlider" ).slider('value',floatVol*100);
    }
}


/**
 *  BACKGROUND FUNCTIONS
 */

function change_background(target)
{
    console.log('BG Change', target);
    const background = document.getElementById('background');
    const visualizer_container = document.getElementById('visualizer_container');
    
    switch(target){
        case 'none':
            $('#background').fadeOut();
            current_bg = 0;
            break;
        case 'image':
            if(current_bg === 1) {
                var new_image_url = 'https://source.unsplash.com/random/1920x1080?v='+(new Date().getTime());
                document.querySelector('#background').style.background = 'url(\''+new_image_url+'\')';
            }
            visualizer_container.classList.remove('visible');
            $('#background').fadeIn();
            current_bg = 1;
            break;
        case 'visualizer':
            $('#background').fadeIn();
            visualizer_container.classList.add('visible');
            current_bg = 2;
            break;
        default: 
            console.error('Invalid Background Type', target);
    }
}

function setupVisualizer()
{
    if (!Detector.webgl) {
        alert('WebGL Missing, visualizer wont work');
        return;
    }

    var audioAnalyser = new AudioAnalyser();
    audioAnalyser.init();

    var view = new View();
    view.init( audioAnalyser );

    var controller = new Controller();
    controller.init( audioAnalyser, view );

    var ctx = audioAnalyser.audioCtx;
    var audio = document.getElementById('stationAudioTrack2');
    var audioSrc = ctx.createMediaElementSource(audio);
    audioAnalyser.source = audioSrc;
    var analyser = audioAnalyser.analyser;

    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);

    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    var frequencyData = new Uint8Array(analyser.frequencyBinCount);

    function renderFrame()
    {
        requestAnimationFrame(renderFrame);
        analyser.getByteFrequencyData(frequencyData);
        // console.log(frequencyData);
    }

    renderFrame();

    // Export stuff
    window.visualizer = {};
    window.visualizer.view = view;
    window.visualizer.controller = controller;
    window.visualizer.audioAnalyser = audioAnalyser;
    window.visualizer.analyser = analyser;
    window.visualizer.audioAnalyser = audioAnalyser;

    var keys = Object.keys(visualizer.controller.visualizers);
    for(var i = 0; i < keys.length; i++){
        visualizer.controller.visualizers[keys[i]].init( visualizer, visualizer.view );
    }
}

function change_visualizer(name)
{
    if(current_bg !== 2)
        change_background('visualizer');

    if(!visualizer.controller.visualizers.hasOwnProperty(name)) {
        return console.error('Visualizer does not exist');
    }

    if(visualizer.controller.activeViz && visualizer.controller.activeViz === name) {
        return console.error('Already current Visualizer');
    }

    if(visualizer.controller.activeViz !== null) {
        visualizer.controller.activeViz.destroy();
    }
    visualizer.controller.activeViz = visualizer.controller.visualizers[name];
    visualizer.controller.activeViz.make();
    visualizer.view.renderVisualization = visualizer.controller.activeViz.render;
    console.log('Changed Visualizer to ', name);

}

function init_visualiser(track)
{
    console.log('Reinit Visualiser on track ', track);
    var ctx = visualizer.audioAnalyser.audioCtx;
    var audio = document.getElementById(`stationAudioTrack${track}`);
    var audioSrc = ctx.createMediaElementSource(audio);
    visualizer.audioAnalyser.source = audioSrc;
    var analyser = visualizer.audioAnalyser.analyser;

    audioSrc.connect(analyser);
    audioSrc.connect(ctx.destination);

    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    console.log('Finished Reinit', track);
}