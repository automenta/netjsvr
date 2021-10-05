"use strict";

class Focus {

    constructor(view) {
        this.layers = [];
        this.view = view;

        const attn = cytoscape({headless: true});
        attn.attnUpdated = _.debounce(()=> {

            const tgt = $('#interests');
            tgt.html('');

            const rank = attn.$().
                //pageRank().rank;
                degreeCentralityNormalized().degree;
                //closenessCentralityNormalized().closeness;

            attn.nodes().roots().sort((a,b)=>rank(b)-rank(a)).forEach(x=>{
                //if (x.data('instance')) return;
                const icon = this.interestIcon(x, rank, attn);
                tgt.append(icon);

                //console.log(x.outgoers());
                x.outgoers().nodes().forEach(xe => {
                   icon.append(this.interestIcon(xe, rank, attn));
                });

            });
        }, 200);
        this.attn = attn;

        let anim = null;

        // The common pick-handling function.
        // Listen for mouse moves and highlight the placemarks that the cursor rolls over.
        // Listen for taps on mobile devices and highlight the placemarks that the user taps.
        let finger = o => {
            //console.log(o);
            if (o.buttons !== 1)
                return;

            //_.forEach(this.touched, t => t.highlighted = false);
            //const touched = this.touched = [];
            let picked;
            try {
                const px = o.clientX, py = o.clientY;
                picked = view.pick(view.canvasCoordinates(px, py));
            } catch (e) {
                console.log(e);
                return;
            }

            const picks = picked.objects;
            //console.log(picks);

            if (picks.length > 0) {
                const x = picks[picks.length - 1];
                //_.forEach(picks, x => {
                if (x.isTerrain) {
                    //toastr.info("terrain " + x.position);
                } else {
                    if (anim === null) {

                        const tgt = new WorldWind.Position().copy(x.userObject.referencePosition);
                        tgt.altitude += 100;

                        anim = new WorldWind.GoToAnimator(view);
                        anim.travelTime = 1000;
                        anim.goTo(tgt, () => {
                            anim = null;
                        });
                    }

                    // const concept = x.userObject.userProperties.concept || x.userObject.displayName;
                    // toastr.info(JSON.stringify(concept), {
                    //     closeButton: true
                    // });
                }
            }
            // _.forEach(picks, p => {
            //     const o = p.userObject;
            //     o.highlighted = true;
            //     touched.push(o);
            // })
            //view.redraw(); // redraw to make the highlighting changes take effect on the screen

        };
        finger = _.debounce(finger, 100);

        //var tapRecognizer = new WorldWind.TapRecognizer(view, finger);
        //view.addEventListener("mousemove", finger);
        view.addEventListener("pointerdown", finger);

        const updatePeriodMS = 200;
        this.running = setInterval(this.run, updatePeriodMS);
    }

    interestIcon(x, rank, attn) {
        const rx = rank(x);
        const xid = x.id();
        const icon = $('<div>').text(xid)
            .addClass('interestIcon').addClass('buttonlike')
            .attr('style', `font-size: ${Math.min(150, 100 * Math.log(1 + rx * 1E3))}%`);

        let goalSelect = $('<select>').append(
            $('<option>').text('++'),
            $('<option>').text('+'),
            $('<option selected>').text(' '),
            $('<option>').text('-'),
            $('<option>').text('--')
        );
        goalSelect.change(e => {
            let goal;
            switch (e.target.value) {
                case '--':
                    goal = -2;
                    break;
                case '-':
                    goal = -1;
                    break;
                default:
                    goal = 0;
                    break;
                case '+':
                    goal = +1;
                    break;
                case '++':
                    goal = +2;
                    break;
            }
            x.data('goal', goal);

            attn.elements().dfs({
                roots: attn.getElementById(xid),
                visit: (v, e, u, i, depth) => {
                    //console.log(xid, ' -> ' + v);
                    const V = v.data('instance');
                    if (V && V.renderables) {
                        _.forEach(V.renderables, r => {
                            if (goal === 0)
                                r.enabled = false;
                            else
                                r.enabled = true;
                        });
                        this.view.redraw();
                    }
                },
                directed: true
            });
        });
        icon.prepend(goalSelect);

        return $('<div>').addClass('interestGroup').append(icon);
    }

    run() {
        _.forEach(this.layers, x => {
            x.update(this);
        });
    }

    position(lat, lon, alt) {
        const cam = this.cam();
        const pos = cam.position;
        if (lat && lon && alt) {
            //cam.tilt = 45;
            pos.latitude = lat;
            pos.longitude = lon;
            pos.altitude = alt;
        }
        return pos;
    }

    cam() {
        return this.view.camera;
    }

    addInterest(x, y, cfg) {
        // if (this.interests.get(i))
        //     return; //ignore duplicate

        //console.log(x, y);
        this.attn.add([
            { group: 'nodes', data: { id: x } },
            { group: 'nodes', data: { id: y } },
            { group: 'edges', data: { /*id: x + '__' + y,*/ source: y, target: x } }
        ]);

        this.attn.attnUpdated();

    }

    addLayer(layer) {
        this.layers.push(layer);

        if (layer.enabled === undefined)
            layer.enable(); //default state

        layer.start(this);
    }

    removeLayer(layer) {
        layer.element.remove();
        delete layer.element;

        this.layers = _.filter(this.layers, x => x !== layer);
        //console.log(layer, ' = ? = ', removed); //TODO
        layer.stop(this);
    }

}


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
