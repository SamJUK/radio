let stations = [];
let volumeBeforeMute = 1;
let hlsTypes = ['m3u8'];
let hls = new Hls();

// On Load
$(function(){

    // Load Stations
    LoadStations();

    SetUpVolumeSlider();

    $('#background').hide();

    setTimeout(function() {
        $('#background').fadeIn();
    }, 100);

    // Setup HLS
    HLSErrorHandling();

});

function LoadStations()
{
    ajaxGet('stations.json', data => {
        stations = JSON.parse(data);
        populateStationsDataList();
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
    $('#stationsDataList').html(html);
}

function onStationModelOpen()
{
    clearStationModel();
    autoFocusStationModel();
}

function clearStationModel()
{
    $('#stationSelector').val("");
}

function autoFocusStationModel()
{
    $('#stationModel').on('shown.bs.modal', function () {
        $('#stationSelector').focus()
    });
}

function stationSelectorKeyHandler(event)
{
    // Enter
   if(event.keyCode === 13){
        modelStationSelected();
    }
}

function muteToggle()
{
    // Check if it has the muted class
    const d = $('#mute');
    const v = $('#VolumeSlider');
    const a = $('#stationAudio');

    if (d.hasClass('muted'))
    {
        d.removeClass('muted');
        v.removeClass('disabled');
        a.prop("volume", volumeBeforeMute);
    }
    else
    {
        d.addClass('muted');
        v.addClass('disabled');
        volumeBeforeMute = a.prop("volume");;
        a.prop("volume", 0);
    }
}

function modelStationSelected()
{
    let option = $("#stationsDataList option[value='" + $('#stationSelector').val() + "']");

    // Does not exist
    if (option.length === 0)
    {
        const childCount = $('errors').children().length;
        const error = `
            <div id="error${childCount}" class="alert alert-danger alert-dismissible fade show" role="alert" data-dismiss="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <strong>Oh No!</strong> That station does not exist!
            </div>
        `;

        $('#errors').prepend(error);
        setTimeout( id => {
            $(`#error${id}`).remove();
        }, 3000, [childCount]);

        return;
    }

    let stationID = option.data('id');
    changeStation(stationID);
    $('#stationModel').modal('toggle');
}

function changeStation (id)
{
    let stationURL = stations[id].audioURL;
    let stationName = stations[id].DisplayName;

    $('#stationName').text(stationName);
    updateStationAudio(stationURL);
}

function updateStationAudio(stationurl)
{
    let audio = $('#stationAudio');

    let split = stationurl.split('.');
    let ext = split[split.length - 1];

    if(hlsTypes.indexOf(ext) !== -1){
        // Is HLS
        audio[0].pause();
        playHLS(stationurl);
    }else{
        // Regular Audio
        hls.destroy();
        audio.attr('src', stationurl);
        audio[0].play();
    }
}

function playHLS(stationurl)
{
    if (Hls.isSupported()) {
        let video = $('#HLSStationAudio')[0];

        hls.destroy();
        hls = new Hls();

        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls.loadSource(stationurl);
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                video.play();
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
        document.getElementById('stationAudio').volume = ui.value/100;
      }
    });
}

function toggleBG()
{
    if ($('#background').is(':visible'))
        $('#background').fadeOut();
    else
        $('#background').fadeIn();
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