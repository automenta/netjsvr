"use strict";




window.addEventListener("load", () => {

    //console.log(WorldWind.configuration);
    WorldWind.configuration.gpuCacheSize = 1e9; // 1gb
    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);


    const w = new WorldWind.WorldWindow("map");
    //console.log(w);
    //w.deepPicking = true;
    w.camera.fieldOfView =
        //15;
        //25;
        40;
    //60;

    const f = new Focus(w);
    //TODO w.clearLayers()
    f.addLayer(new HomeLayer());
    f.addLayer(new GeoLayer("Atmosphere", new WorldWind.AtmosphereLayer()).disable());
    f.addLayer(new GeoLayer("View Controls", new WorldWind.ViewControlsLayer(w)).disable());
    //view.addLayer(new WorldWind.CompassLayer());
    //view.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));


    f.addLayer(new ShapefileLayer("Countries", "https://worldwind.arc.nasa.gov/web/examples/data/shapefiles/naturalearth" +
        "/ne_110m_admin_0_countries/ne_110m_admin_0_countries.shp").disable());
    f.addLayer(new ShapefileLayer("Cities", "https://worldwind.arc.nasa.gov/web/examples/data/shapefiles/naturalearth" +
        "/ne_50m_populated_places_simple/ne_50m_populated_places_simple.shp").disable());

    f.addLayer(new GeoLayer("OSM Map", new WorldWind.OpenStreetMapImageLayer())/*.opacity(0.5)*/);
    f.addLayer(new GeoLayer("Satellite", new WorldWind.BingAerialWithLabelsLayer()).disable());
    //f.addLayer(new WWLayer("BMGNOne", new WorldWind.BMNGOneImageLayer()).disable());

    const pos = f.position();
    //console.log(pos);
    const osm = new OSMNodes(f);
    f.addLayer(osm);

    /*DEPRECATED:*/ osm._update(
        '(way<bbox>; node<bbox>;);'
        //'(way[highway]<bbox>; relation<bbox>; node<bbox>;);'
        , pos.latitude, pos.longitude, /*0.007*/ 0.003)


    $("#side_toggle").click(() => {
        const bc = document.body.classList;
        if (bc.contains('sideExpanded'))
            bc.remove('sideExpanded');
        else
            bc.add('sideExpanded');
    });
    $("#addmenu_toggle").click(() => {
        $("#addmenu").toggle(/*"slow"*/);
    });

}, false);
