$(function(){
    // To add new datasets:
    // 1. Add the necessary folders in the repository
    // 2. Add the proper entries below

    var datasets = [
        {
            id: 'aukerman',
            label: "Aukerman",
            center: new L.LatLng(41.30442, -81.75232)
        },
        {
            id: 'brighton_beach',
            label: "Brighton Beach",
            center: new L.LatLng(46.84261, -91.99402)
        },
        {
            id: 'sand_key',
            label: "Sand Key",
            center: new L.LatLng(27.95864, -82.83185)
        },
    ];

    var engines = [
        {
            id: "odm-0.9.9",
            label: "ODM 0.9.9",
        },
        {
            id: "odm-2.1.1",
            label: "ODM 2.1.1"
        },
	{
            id: "odm-2.4.7",
	    label: "ODM 2.4.7",
	},
	{
	    id: "odm-2.8.0",
	    label: "ODM 2.8.0",
	},
    {
	    id: "odm-3.0.0",
	    label: "ODM 3.0.0",
	    rightStart: true
	},
        {
            id: "dronedeploy-2.59.0",
            label: "Drone Deploy 2.59.0",
            leftStart: true
        },
        {
            id: "metashape-1.5.2",
            label: "Metashape 1.5.2"
        },
        {
            id: "dronemapper-1.9",
            label: "DroneMapper 1.9"
        },
        {
            id: "nodemicmac-0.0.1",
            label: "NodeMICMAC 0.0.1"
        },
        {
            id: "pix4d-4.4.10",
            label: "Pix4D 4.4.10"
        },
    ]
    
    // Add functionality to the btn for switching comparison type
    $("#btnChangeComparison").on("click", function(){
        var comparisonType = $("#btnChangeComparison").attr("data-comparison");
        if (comparisonType === "sideBySide"){
            $("#btnChangeComparison").attr("data-comparison", "sync");
            $("#btnChangeComparison").text("Switch to slider comparison");
            // get center and zoom of sideBySide map and set sync map to it
            syncMap1.setView(sideBySideMap.getCenter(), sideBySideMap.getZoom());
            updateLayers();        
        }else{
            $("#btnChangeComparison").attr("data-comparison", "sideBySide");
            $("#btnChangeComparison").text("Switch to synced comparison");
            // get center and zoom of sync map and set sideBySide map to it
            sideBySideMap.setView(syncMap1.getCenter(), syncMap1.getZoom());
            updateLayers();
        }  
    });  

    // Initiate maps
    var sideBySideMap = L.map('sideBySideMap', {
        zoom: 20,
        center: datasets[0].center
    });
    var syncMap1 = L.map('syncMap1', {
        zoom: 20,
        center: datasets[0].center
    });
    var syncMap2 = L.map('syncMap2', {
        zoom: 20,
        center: datasets[0].center,
        zoomControl: false
    });
    
    // Create and add an OSM reference layer to each map
    // (we cannot create just one L.tileLayer and initiate all 3 maps with it)
    var osmTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmTileConfig = {
        maxZoom: 99,
        maxNativeZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
    L.tileLayer(osmTileUrl, osmTileConfig).addTo(sideBySideMap);
    L.tileLayer(osmTileUrl, osmTileConfig).addTo(syncMap1);
    L.tileLayer(osmTileUrl, osmTileConfig).addTo(syncMap2);
    
    // Sync the two synced maps per https://github.com/jieter/Leaflet.Sync
    syncMap1.sync(syncMap2);
    syncMap2.sync(syncMap1);


    // Populate datasets
    var $dataset = $("#dataset");
    $dataset.on('change', function(e){
        updateLayers("dataset");
    });
    
    for (var i in datasets){
        var d = datasets[i];
        var $opt = $('<option value="' + d.id + '">' + d.label + '</option>');
        
        $dataset.append($opt);
    }

    // Populate engines
    var $leftEngine = $("#leftEngine");
    $leftEngine.on('change', function(e){
        if ($(this).val() !== $rightEngine.val()){
            updateLayers();
        }else{
            var engId = null;
            for (var k in engines){
                if (engines[k].id !== $rightEngine.val()){
                    engId = engines[k].id;
                    break;
                }
            }
            $(this).val(engId);
            updateLayers();
        }
    });
    var $rightEngine = $("#rightEngine");
    $rightEngine.on('change', function(e){
        if ($(this).val() !== $leftEngine.val()){
            updateLayers();
        }else{
            var engId = null;
            for (var k in engines){
                if (engines[k].id !== $leftEngine.val()){
                    engId = engines[k].id;
                    break;
                }
            }
            $(this).val(engId);
            updateLayers();
        }
    });
    
    for (var i in engines){
        var e = engines[i];
        var $opt = $('<option value="' + e.id + '"' + (e.rightStart ? 'selected' : '') + '>' + e.label + '</option>');
        $rightEngine.append($opt);
        
        $opt = $('<option value="' + e.id + '"' + (e.leftStart ? 'selected' : '') + '>' + e.label + '</option>');
        $leftEngine.append($opt);
    }

    var $product = $("#product");
    $product.on("change", function(){
        updateLayers();
    });

    var leftLayer, rightLayer;
    var prefix = "/";
    if (window.location.href.toLowerCase().indexOf("opendronemap.github.io") !== -1){
        prefix = "/UAVArena/";
    }
    var layerConfig = {
        noWrap: true,
        maxZoom: 99,
        maxNativeZoom: 21,
        tms: true
    }
    var sideBySide = L.control.sideBySide([], []).addTo(sideBySideMap);
    
    var cleanLayers = function(){
        if (sideBySideMap.hasLayer(leftLayer)) sideBySideMap.removeLayer(leftLayer);
        if (sideBySideMap.hasLayer(rightLayer)) sideBySideMap.removeLayer(rightLayer);
        if (syncMap1.hasLayer(leftLayer)) syncMap1.removeLayer(leftLayer);
        if (syncMap2.hasLayer(rightLayer)) syncMap2.removeLayer(rightLayer);
    }
    
    var updateSideBySideLayers = function(){  
        leftLayer =  L.tileLayer(prefix + 'data/' + $leftEngine.val() +'/' + 
            $dataset.val() + '/' + $product.val() + '/tiles/{z}/{x}/{y}.png', layerConfig);
        rightLayer = L.tileLayer(prefix + 'data/' + $rightEngine.val() +'/' + 
            $dataset.val() + '/' + $product.val() + '/tiles/{z}/{x}/{y}.png', layerConfig);

        if (leftLayer){
            leftLayer.addTo(sideBySideMap);
            sideBySide.setLeftLayers([leftLayer]);
        }else{
            sideBySide.setLeftLayers([]);
        }

        if (rightLayer){
            rightLayer.addTo(sideBySideMap);
            sideBySide.setRightLayers([rightLayer]);
        }else{
            sideBySide.setRightLayers([]);
        }
    };
    
    var updateSyncLayers = function(){
        leftLayer =  L.tileLayer(prefix + 'data/' + $leftEngine.val() +'/' + 
            $dataset.val() + '/' + $product.val() + '/tiles/{z}/{x}/{y}.png', layerConfig);
        rightLayer = L.tileLayer(prefix + 'data/' + $rightEngine.val() +'/' + 
            $dataset.val() + '/' + $product.val() + '/tiles/{z}/{x}/{y}.png', layerConfig);

        if (leftLayer) leftLayer.addTo(syncMap1);
        if (rightLayer) rightLayer.addTo(syncMap2);
    };
    
    var updateLayers = function(updateType){
        cleanLayers();
        // Center the map on the dataset *if* the dataset changes, 
        // because then we're jumping to a different location
        if(updateType === "dataset"){ 
            for (var k in datasets){
                if (datasets[k].id === $dataset.val()){
                    syncMap1.panTo(datasets[k].center);
                    sideBySideMap.panTo(datasets[k].center);
                    break;
                }
            }
        }
        
        // show hide the maps according to which comparison is active
        var comparisonType = $("#btnChangeComparison").attr("data-comparison");
        if (comparisonType === "sideBySide"){
            $("#syncMap1").hide();
            $("#syncMap2").hide();
            $("#sideBySideMap").show();
            updateSideBySideLayers();
        }else{
            $("#syncMap1").show();
            $("#syncMap2").show();
            $("#sideBySideMap").hide();
            updateSyncLayers();
        }
    };

    updateLayers();

});
