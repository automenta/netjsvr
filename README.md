# 🐈🎮

# Layers
 * yield Objects and Tags (adaptively cached in digraph).  
 * refreshed periodically or when focus location changes.
 * includes base layers and other decorations

### Home
for control of the focus (position, etc)
typically this will be user's actual location.

### WorldWind Geo
built-in: streets, satellite, etc.

### OpenStreetMaps (OSM)
loads vector map features from the Overpass API 

### Heatmap
finite-size 2D/3D heatmap.
its local minima and maxima can bias routing.

### Route
similar to the Home layer, this represents the location of an active destination.
it provides access to all route planning and route visualization parameters.
this can interact with a real-time navigation system, which might utilize text-to-speech etc.

### Photogrammetry
3D model construction from multiple-POV photos or video

### ClimateViewer3D Geo Layers
most of the file types it uses with Cesium.js are supported by WorldWind.js

## Objects
 * various kinds of media
 * includes user created tweets/notes that can be tagged with location.  
 * by default: private, but public notes are useful in cooperative planning.  (ex: WebRTC)
 * these notes can utilize an extensive semantic ontology and include multimedia
 * they can be used to add factual environment data, or make corrections to source datasets (ex: OSM) 

## Tag
 * enabled: default true, but if false then mostly hidden
 * pri: numeric priority, which can be assigned by graph metrics or otherwise

## Values
current preferences involving Tags or specific objects
expressed as a set value of assignments
 * goal(x)=y, y is number from -1 "red" to +1 "green" (0 is neutral and has no effect)
 * TODO other semantic dimensions?
 
these can be serialized for sharing or as re-usable presets or templates

    
## Rendering Loop
```
if (focus position or scope or time changed) {
    refresh layers
}
if (tags changed) {
    re-render tag widgets
        adaptive hierarchical menu (DOM elements)
}
if (values changed) {
    for each Object, apply value assignments and predictions to adjust:
        visibility/opacity
        color
        labels, popup menus, etc.       
}
```       
    