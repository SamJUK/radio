var stations = [];
var volumeBeforeMute = 1;

// On Load
$(function(){

    // Load Stations
    LoadStations();

    SetUpVolumeSlider();

    $('#background').hide();

    setTimeout(function() {
        $('#background').fadeIn();
    }, 100);

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
    var html = '';
    var i = 0;
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
   if(event.keyCode == 13){
        modelStationSelected();
    }
}

function muteToggle()
{
    // Check if it has the muted class
    var d = $('#mute');
    var v = $('#VolumeSlider');
    var a = $('#stationAudio');

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
    var option = $("#stationsDataList option[value='" + $('#stationSelector').val() + "']");

    // Does not exist
    if (option.length == 0)
    {
        var childCount = $('errors').children().length;
        var error = `
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

    var stationID = option.data('id');
    changeStation(stationID);
    $('#stationModel').modal('toggle');
}

function changeStation (id)
{
    var stationURL = stations[id].audioURL;
    var stationName = stations[id].DisplayName;

    $('#stationName').text(stationName);
    $('#stationAudio').attr('src', stationURL);
    $('#stationAudio')[0].play();
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
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this.responseText);
        }
    };
    xhttp.open("GET", page, true);
    xhttp.send();
}