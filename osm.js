class OSMNodes extends GeoLayer {

    constructor(focus) {
        super("OpenStreetMaps", new WorldWind.RenderableLayer());
        this.focus = focus;
        this.focus.view.addLayer(this.layer);

        // const attr = new WorldWind.PlacemarkAttributes(null);
        // attr.imageSource = WorldWind.configuration.baseUrl + "images/white-dot.png";
        // attr.imageScale = 0.25;
        // attr.imageColor = WorldWind.Color.WHITE;
        // attr.labelAttributes.offset = new WorldWind.Offset(
        //     WorldWind.OFFSET_FRACTION, 0.5,
        //     WorldWind.OFFSET_FRACTION, 1.5);

        this.shapeConfigurationCallback = (geometry, properties) => {
            const cfg = {};

            if (geometry.isPointType() || geometry.isMultiPointType()) {

                /*
                const v = new WorldWind.PlacemarkAttributes(attr);

                const amenity = properties.amenity;
                if (amenity) {
                    if (amenity === 'post_box')
                        v.imageColor = WorldWind.Color.BLUE;
                    else if (amenity === 'bank')
                        v.imageColor = WorldWind.Color.GREEN;
                    else
                        v.imageColor = WorldWind.Color.RED;
                }
                //v.imageColor = JSON.toString(properties).hash
                cfg.attributes = v;

                if (properties && (properties.name || properties.Name || properties.NAME)) {
                    cfg.name = properties.name || properties.Name || properties.NAME;
                }
                // if (properties && properties.POP_MAX) {
                //     const population = properties.POP_MAX;
                //     configuration.attributes.imageScale = 0.01 * Math.log(population);
                // }
                */
            } else if (geometry.isLineStringType() || geometry.isMultiLineStringType()) {
                cfg.attributes = new WorldWind.ShapeAttributes(null);
                cfg.attributes.depthTest = false;
                cfg.attributes.drawInterior = false;
                cfg.attributes.drawOutline = true;
                // cfg.attributes.outlineWidth = 2;
                // cfg.attributes.outlineColor = new WorldWind.Color(
                //     0.375 + 0.5 * Math.random(),
                //     0.375 + 0.5 * Math.random(),
                //     0.375 + 0.5 * Math.random(),
                //     0.9);
            } else if (geometry.isPolygonType() || geometry.isMultiPolygonType()) {
                cfg.attributes = new WorldWind.ShapeAttributes(null);
                //cfg.attributes.depthTest = false;
                cfg.attributes.drawOutline = false;
                // Fill the polygon with a random pastel color.
                cfg.attributes.interiorColor = new WorldWind.Color(
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    1);
                // Paint the outline in a darker variant of the interior color.
                // configuration.attributes.outlineColor = new WorldWind.Color(
                //     0.5 * configuration.attributes.interiorColor.red,
                //     0.5 * configuration.attributes.interiorColor.green,
                //     0.5 * configuration.attributes.interiorColor.blue,
                //     1.0);
            }

            return cfg;
        };
    }

    update(focus) {
        //TODO
    }

    _update(query, lat, lon, latHalf, lonHalf) {
        if (!lonHalf)
            lonHalf = latHalf; //TODO based on latitude


        const latMin = lat - latHalf, latMax = lat + latHalf;
        const lonMin = lon - lonHalf, lonMax = lon + lonHalf;

        //dither these numbers to maximize cache hit rates:
        const bbox = this.bbox(
            _.round(latMin, 3), _.round(lonMin, 3),
            _.round(latMax, 3), _.round(lonMax, 3));

        $.ajax({
            url:
                'https://z.overpass-api.de/api/interpreter'
                //'https://lz4.overpass-api.de/api/interpreter'
                //'https://overpass.openstreetmap.fr/api/interpreter'
                //'https://overpass-api.de/api/interpreter'
                + '?data=' + encodeURIComponent(
                    '[out:json];\n' + query.replaceAll('<bbox>', bbox) + '\nout geom' + bbox + ';'
                ),
            contentType: 'application/json',
            dataType: 'json',
            headers: {
                "Accepts": "text/plain; charset=utf-8",
                "Cache-Control": 'max-age=3600'//<seconds> //TODO this may not matter
            }
        }).done(X => this._load(X));
    }

    bbox(latMin, lonMin, latMax, lonMax) {
        return '(' + latMin + ',' + lonMin + ',' + latMax + ',' + lonMax + ')';
    }

    _load(X) {
        const x = osmtogeojson(X);
        const features = _.filter(x.features, z =>{
            return z.properties.amenity || (z.geometry.type==='Polygon' ||z.geometry.type==='LineString');
        });
        _.forEach(features, f => this.load(f));
    }

    load(x) {

        // const interests = [];

        //register inferred interests
        const pp = x.properties;
        // if (pp.amenity) interests.push(pp.amenity);
        // if (pp.highway) interests.push('Way');
        // if (pp.power) interests.push('Power');
        // if (pp.boundary) interests.push('Boundary');
        // if (pp.barrier) interests.push('Barrier');
        // if (pp.waterway) interests.push('Water');
        // if (pp.building) interests.push('Building');
        // _.forEach(interests, i => {
        //     this.focus.addInterest(pp.id, i);
        // });
        //console.log(pp);
        const X = pp.id;
        _.forEach(pp, (value, key) => {
            if (key === 'id' || key === 'name' || key === 'ele' || key.startsWith('addr') || key==='odbl' || key==='layer' || key === 'website' || key.startsWith('source') || key.startsWith('gnis') || key.startsWith('tiger'))
                return;
            // this.focus.addInterest(X, key);
            // this.focus.addInterest(X, value);
            // if (value === 'yes') {
            //     this.focus.addInterest(X, key);
            // } else {
                const keyvalue = key + '=' + value;
                this.focus.addInterest(X, keyvalue);
                this.focus.addInterest(keyvalue, key);
                if (value!=='yes' && value!=='no' && parseFloat(value)===NaN)
                    this.focus.addInterest(keyvalue, value);
            // }
            const xx = this.focus.attn.getElementById(X);
            xx.data('instance', x);
            //xx.style('display', 'none');
        });


        const ll = [];
        const p = new WorldWind.GeoJSONParser(x);

        const altitudeDefault = 6, altitudeRoad = 4;

        p.addRenderablesForPoint = function (layer, geometry, properties) {
            if (!(!this.crs || this.crs.isCRSSupported())) return;

            const cfg = this.shapeConfigurationCallback(geometry, properties);

            const coords = geometry.coordinates;
            const lon = coords[0],
                lat = coords[1];
            let alt = coords[2] ? coords[2] : 0;
            alt += 5;
            // var reprojectedCoordinate = this.getReprojectedIfRequired(lat, lon, this.crs);
            // lat = reprojectedCoordinate[1];
            // lon = reprojectedCoordinate[0];
            const w = 0.0001;
            const meshPositions = [];
            for (let lt = lat - w / 2; lt <= lat + w / 2; lt += w) {
                const row = [];
                for (let ln = lon - w / 2; ln <= lon + w / 2; ln += w)
                    row.push(new WorldWind.Position(lt, ln, alt));
                meshPositions.push(row);
            }
            //console.log(meshPositions);
            const icon = new WorldWind.GeographicMesh(meshPositions, cfg);
            let attr = new WorldWind.ShapeAttributes(null);
            attr.concept = properties;
            attr.outlineColor = WorldWind.Color.BLACK;
            attr.interiorColor = new WorldWind.Color(1, 1, 1, 0.75);
            attr.applyLighting = true;
            icon.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            icon.attributes = attr;
            if (cfg && cfg.name) icon.label = cfg.name;
            if (cfg && cfg.eyeDistanceScaling) icon.eyeDistanceScaling = cfg.eyeDistanceScaling;
            if (cfg && cfg.eyeDistanceScalingThreshold) icon.eyeDistanceScalingThreshold = cfg.eyeDistanceScalingThreshold;
            if (cfg && cfg.imageRotation) icon.imageRotation = cfg.imageRotation;
            if (cfg && cfg.imageRotationReference) icon.imageRotationReference = cfg.imageRotationReference;
            if (cfg && cfg.highlightAttributes) icon.highlightAttributes = cfg.highlightAttributes;
            if (cfg && cfg.pickDelegate) icon.pickDelegate = cfg.pickDelegate;
            if (cfg && cfg.userProperties) icon.userProperties = cfg.userProperties;
            ll.push(icon);
        };

        p.addRenderablesForPolygon = function (layer, geometry, properties) {

            if (!(!this.crs || this.crs.isCRSSupported())) return;

            const cfg = this.shapeConfigurationCallback(geometry, properties);

            const b = [];
            const boundaries = geometry.coordinates;
            for (let boundariesIndex = 0; boundariesIndex < boundaries.length; boundariesIndex++) {
                const positions = [];
                const points = boundaries[boundariesIndex];
                for (let positionIndex = 0; positionIndex < points.length; positionIndex++) {
                    const pp = points[positionIndex];
                    const lon = pp[0], lat = pp[1], alt = pp[2] ? pp[2] : altitudeDefault;
                    const reprojectedCoordinate = this.getReprojectedIfRequired(lat, lon, this.crs);
                    positions.push(new WorldWind.Position(reprojectedCoordinate[1], reprojectedCoordinate[0], alt));
                }
                b.push(positions);
            }
            cfg.attributes.concept = properties;
            cfg.attributes.drawOutline = false;
            cfg.attributes.depthTest = true;
            cfg.attributes.drawVerticals = false;
            cfg.attributes.applyLighting = cfg.attributes.enableLighting = false;
            const shape = new WorldWind.Polygon(
                b,
                cfg && cfg.attributes ? cfg.attributes : null);
            shape.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            shape.extrude = true;
            if (properties.name)
                shape.displayName = properties.name;

            if (cfg && cfg.highlightAttributes) shape.highlightAttributes = cfg.highlightAttributes;
            if (cfg && cfg.pickDelegate) shape.pickDelegate = cfg.pickDelegate;
            if (cfg && cfg.userProperties) shape.userProperties = cfg.userProperties;
            ll.push(shape);
        };
        const that = this;
        p.addRenderablesForLineString = function (layer, geometry, properties) {

            if (!(!this.crs || this.crs.isCRSSupported()))
                return;

            const cfg = this.shapeConfigurationCallback(geometry, properties);

            const positions = [];
            const points = geometry.coordinates;
            for (let pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
                const pp = points[pointsIndex];
                const lon = pp[0], lat = pp[1], altitude = pp[2] ? pp[2] : altitudeRoad;
                const reprojectedCoordinate = this.getReprojectedIfRequired(lat, lon, this.crs);
                positions.push(new WorldWind.Position(reprojectedCoordinate[1], reprojectedCoordinate[0], altitude));
            }
            cfg.attributes.concept = properties;
            cfg.attributes.depthTest = true;
            cfg.attributes.applyLighting = cfg.attributes.enableLighting = false;
            cfg.attributes.drawInterior = true;
            // cfg.attributes.outlineColor =
            //     //undefined;
            //     new WorldWind.Color(1, 0.5, 0, 1);
            cfg.attributes.drawOutline = false;
            //cfg.attributes.outlineWidth = 4;


            let thick = 1;
            let color = undefined;

            //console.log(properties);
            if (properties.footway === 'sidewalk') {
                thick = 0.5;
                color = new WorldWind.Color(0.5, 0.5, 0.5, 1);
            }
            if (properties.lanes === '1') {
                thick = 2;
                //color = new WorldWind.Color(0.5, 1, 0, 1);
            } else if (properties.lanes === '2') {
                thick = 4;
                //color = new WorldWind.Color(0.5, 1, 0, 1);
            } else {

            }

            cfg.attributes.interiorColor = color || new WorldWind.Color(1, 0.5, 0, 1);

            const path =
                // new WorldWind.Path(
                //     //new WorldWind.SurfacePolyline(
                //     positions, cfg.attributes);
                new WorldWind.Polygon(that.polygonize(positions, thick * 0.00005), cfg.attributes);
            //new WorldWind.SurfacePolygon(that.polygonize(positions), cfg.attributes);

            path.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            path.followTerrain = true;
            path.extrude = false;
            //path._numSubSegments = 3;
            if (cfg && cfg.highlightAttributes) path.highlightAttributes = cfg.highlightAttributes;
            if (cfg && cfg.pickDelegate) path.pickDelegate = cfg.pickDelegate;
            if (cfg && cfg.userProperties) path.userProperties = cfg.userProperties;
            ll.push(path);
        };

        const yl = this.layer;

        x.renderables = ll;

        p.load(null, this.shapeConfigurationCallback, yl);

        _.forEach(ll, yy => {
            yy.enabled = false;
            return yl.addRenderable(yy);
        });
    }

    polygonize(positions, thick) {
        //TODO better
        const y = [];
        const n = positions.length;
        const theta = Math.atan2(positions[n - 1].longitude - positions[0].longitude, positions[n - 1].latitude - positions[0].latitude);
        const thickHalfX = thick / 2 * Math.cos(theta);
        const thickHalfY = thick / 2 * Math.sin(theta);
        _.forEach(positions, x => {
            const xx = _.clone(x);
            xx.longitude -= thickHalfX;
            xx.latitude -= thickHalfY;
            y.push(xx);
        });
        _.forEach(positions, x => {
            const xx = _.clone(x);
            xx.longitude += thickHalfX;
            xx.latitude += thickHalfY;
            y.unshift(xx);
        });
        return y;
    }

    stop(focus) {
        _.forEach(this.layers, focus.removeLayer);
        delete this.layers;
    }
}
