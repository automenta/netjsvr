class ShapefileLayer extends GeoLayer {
    constructor(name, url) {
        super(name, new WorldWind.RenderableLayer(name));
        this.url = url;

    }
    start(f) {
        const shapeFileOutlineLoader = (attributes, record) => {
            const cfg = {};
            cfg.name = attributes.values.name || attributes.values.Name || attributes.values.NAME;

            if (record.isPointType()) { // Configure point-based features (cities, in this example)
                cfg.name = attributes.values.name || attributes.values.Name || attributes.values.NAME;
                cfg.attributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);

            } else if (record.isPolygonType()) { // Configure polygon-based features (countries, in this example).
                cfg.attributes = new WorldWind.ShapeAttributes(null);
                cfg.attributes.drawInterior = false;
                cfg.attributes.outlineWidth = 10;
                cfg.attributes.outlineColor = new WorldWind.Color(
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    1.0);
            }
            //TODO other shape types
            return cfg;
        };

        const countriesLayer = this.layer;
        new WorldWind.Shapefile(
            this.url
        ).load(null, shapeFileOutlineLoader, countriesLayer);

        super.start(f);
    }

}

