/**
 * lEMON - Earthdawn Map ONline
 */

var map;
var mc;
var initial_pos = new google.maps.LatLng(48.036195, 7.847339);
var iconsize = {x: 32, y: 37};
var info_window = new google.maps.InfoWindow;
/*
 * maps symbol names to icons
 */
var symbol_icon_map = {
    'city': "http://atomkraftprotz.de/lEMON/img/citywalls.png",
    'capital': "http://atomkraftprotz.de/lEMON/img/palace-2.png",
    'village': "http://atomkraftprotz.de/lEMON/img/hut.png",
    'tskrangcity': "http://atomkraftprotz.de/lEMON/img/marina-2.png",
    'milcamp': "http://atomkraftprotz.de/lEMON/img/tower.png",
    'trollclan': "http://atomkraftprotz.de/lEMON/img/cave-2.png",
    'ruins': "http://atomkraftprotz.de/lEMON/img/ruins-2.png",
    'windlings': "http://atomkraftprotz.de/lEMON/img/japanese-temple.png",
    'empty': "http://atomkraftprotz.de/lEMON/img/transparent.png"
};

/*
 * switch off most labels gmaps provides 
 */
var styles = [
    {"stylers": [{"visibility": "off"}]},
    {
        "featureType": "landscape.natural",
        "stylers": [{"visibility": "on"}]
    },
    {
        "featureType": "water",
        "stylers": [{"visibility": "on"}]
    },
    {
        "featureType": "water",
        "stylers": [{"visibility": "on"}]
    },
    {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [{"visibility": "off"}]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "labels",
        "stylers": [{"visibility": "off"}]
    }
];

/*
 * define initial settings for the map  
 */
var mapOptions = {
    zoom: 5,
    center: initial_pos,
    mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.TERRAIN]
    },
    mapTypeId: google.maps.MapTypeId.TERRAIN
};


google.maps.event.addDomListener(window, 'load', initialize);


function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    map.setOptions({styles: styles, streetViewControl: false});
    mc = new MarkerClusterer(map, [], {gridSize: 50, maxZoom: 15,imagePath: 'images/m'});

    //iterate geo json with places and add them to our map using the addPlaces fun
    $.getJSON("https://raw.githubusercontent.com/cgars/lEMON/master/locations.json", addPlaces);
    //initialize the distance measurement
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYLINE,
            ]
        },
        editable: false,
        drawingMode: null
    });
    drawingManager.setMap(map);

    //Show the path distance one a path is complete
    google.maps.event.addListener(drawingManager, 'overlaycomplete',
        showDistance);
    //show the add location dialog on left click
    map.addListener("rightclick", addPlace);
}


function createPlaceMarker(entry, index, array) {
    var latLng = new google.maps.LatLng(entry.geometry.coordinates[1],
        entry.geometry.coordinates[0]);
    var marker = new MarkerWithLabel({
        position: latLng,
        draggable: false,
        map: map,
        labelContent: entry.properties.title,
        labelClass: "labels",
        labelStyle: {opacity: 0.75},
        icon: {
            url: symbol_icon_map[entry.properties.iconname],
            size: new google.maps.Size(iconsize.x, iconsize.y, 'px', 'px')
        }
    });
    return marker;
}

function addPlaces(geojson) {
    var places = geojson.features.map(createPlaceMarker);
    mc.addMarkers(places);
};

function addPlace(event) {
    var add_loc_html = jQuery.validator.format(
        "<H3>Add location</H3>" +
        "name:<input id=name></input><br>" +
        "Lat:<div id=lat>{0}</div>" +
        "Lng:<div id=lng>{1}</div>" +
        "<br><select name=top5 id=select>{2}</select><br>" +
        "<button>Add</Button>");
    var option_template = jQuery.validator.format(
        "<option>{0}</option>");
    var options = Object.keys(symbol_icon_map).map(function (a) {
        return option_template(a);
    }).reduce(function (a, b) {
        return a + b;
    });
    info_window.setContent(add_loc_html(event.latLng.lng(), event.latLng.lat(), options));
    info_window.setPosition(event.latLng);
    info_window.open(map);
    $("button")
        .button()
        .click(showJsonString);
    //info_window.addListener('closeclick', getJsonString);
};

function showJsonString(event) {

    var json_template = jQuery.validator.format(
        "<div>Please copy the following text and send it to the map maker or fork https://github.com/cgars/lEMON " +
        "add it to locations.json and make a pull request:<br>" +
        "{\"type\": \"Feature\",\"properties\": {\"title\": \"" +
        "{0}\",\"size\": 8,\"iconname\":\"{1}\"},\"geometry\": {" +
        "\"type\": \"Point\",\"coordinates\": [{2},{3}]}}</div>");
    //info_window.open(map);
    var json_string = json_template($("#name").val(), $("#select").val(), $("#lat").text(),
        $("#lng").text());
    $("#alert").dialog({height: 'auto', width: 'auto'});
    $("#alert").html(json_string);
    info_window.close();
};

function showDistance(event) {
    var distance = google.maps.geometry.spherical.computeLength(
        event.overlay.getPath());
    var infowindow = new google.maps.InfoWindow({
        content: "Distance is:" + distance / 1000,
        position: event.overlay.getPath().getAt(
            event.overlay.getPath().getLength() - 1)
    });
    infowindow.open(map);
    event.overlay.setMap(null);
};