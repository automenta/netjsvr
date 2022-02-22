class Focus {

    constructor(view) {
        this.layers = [];
        this.view = view;

        const attn = cytoscape({
            //headless:true
            container: document.getElementById('overlay'),
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        //'label': 'data(id)',
                        //'background-color': '#666',
                        'background-opacity': 0,
                        'width': (x)=>{
                             return 10*(1+Math.log(1 + x.outdegree()/1));
                         },
                         'height': (x)=>{
                             return 10*(1+Math.log(1 + x.outdegree()/1));
                         }
                    }
                }

                // {
                //     selector: 'edge',
                //     style: {
                //         'width': 3,
                //         'line-color': '#ccc',
                //         'target-arrow-color': '#ccc',
                //         'target-arrow-shape': 'triangle',
                //         'curve-style': 'bezier'
                //     }
                // }
            ],

        });
        attn.attnUpdated = _.debounce(()=> {

            const a =
                attn.$()
                // attn.$().filter(e => {
                //     return !e.isNode() || !e.data('instance');
                // }).kruskal()
            ;
            {
                // const tgt = $('#interests');
                // tgt.html('');
                //

                //
                // const rank = a //attn.$()
                //     //pageRank().rank;
                //     .degreeCentralityNormalized().degree;
                // //closenessCentralityNormalized().closeness;
                //
                // a/*attn*/.nodes().roots().sort((a,b)=>rank(b)-rank(a)).forEach(x=>{
                //     //if (x.data('instance')) return;
                //     const icon = this.interestIcon(x, rank, attn);
                //     tgt.append(icon);
                //
                //     //console.log(x.outgoers());
                //     x.outgoers().nodes().forEach(xe => {
                //         icon.append(this.interestIcon(xe, rank, attn));
                //     });
                //
                // });

            }

            attn.domNode();

            a/*attn*/.nodes().forEach(x => {
                //console.log(x, x.outdegree());
                const d = x.outdegree();
                //if (d===0)
                if (d <= 1)
                    x.style('display', 'none');

            });


            //console.log(attn);
            //TODO stop any previous layout?
            try {
                attn.layout({
                    //name: 'grid'
                    //name: 'cose', numIter: 50,  coolingFactor: 0.999, animate: false
                    name: 'breadthfirst', circle: true/*, nodeDimensionsIncludeLabels: true*/
                }).run();
            } catch (e) {  }
            // attn.layout({
            //     //name: 'grid'
            //     name: 'cose', numIter: 50,  coolingFactor: 0.999, animate: false, randomize:false
            //     //name: 'breadthfirst', circle: true/*, nodeDimensionsIncludeLabels: true*/
            // }).run();

        }, 1000);
        this.attn = attn;

        this.GOAL_EPSILON = 0.01;

        this.spread = _.debounce(()=>{
            this._spread();
        }, 100);

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

    /** spreading activation iteration */
    _spread() {

        const inRate = 0.2, outRate = 0.4;

        this.attn.nodes().forEach(x => {
           const g = this.goal(x);
           if (Math.abs(g) < this.GOAL_EPSILON) return;

           const I = x.indegree(), O = x.outdegree();
           if (I > 0) {
               //TODO double-buffer
               x.incomers().nodes().forEach(y => {
                   if (y.data('specified')) return; //dont modify, set by user
                   this.goalAdd(y, g * inRate); //TODO goalLerp
               });
           }
           if (O > 0) {
               x.outgoers().nodes().forEach(y => {
                   if (y.data('specified')) return; //dont modify, set by user
                   this.goalAdd(y, g * outRate); //TODO goalLerp
               });
           }
        });
        this.attn.nodes().forEach(x => {
            const icon = x.data('icon');
            if (icon) {
                const gx = this.goal(x);
                const _green = Math.max(gx, 0);
                const _red = Math.max(-gx, 0);

                const iconColorIntensity = 0.5;
                const green = parseInt(_green * 256 * iconColorIntensity);
                const red = parseInt(_red * 256 * iconColorIntensity);
                const blue = 0;
                icon.css('background-color', 'rgba(' + red + ',' + green + ',' + blue + ', 1)');

                this.attn.elements().dfs({
                    roots: x,//attn.getElementById(xid),
                    directed: true,
                    visit: (v, e, u, i, depth) => {
                        //console.log(xid, ' -> ' + v);
                        const V = v.data('instance');
                        if (V && V.renderables) {
                            _.forEach(V.renderables, r => {
                                //console.log(r);
                                if (Math.abs(gx) < this.GOAL_EPSILON)
                                    r.enabled = false;
                                else {
                                    r.enabled = true;
                                    if (r.attributes && r.attributes.interiorColor) {
                                        r.attributes.interiorColor.red = _red;
                                        r.attributes.interiorColor.green = _green;
                                        r.attributes.interiorColor.blue = 0;
                                        r.attributes.interiorColor.alpha = Math.abs(gx);
                                    }
                                }
                            });
                            //this.view.redraw();
                        }
                    }
                });

            }
        });
        this.view.redraw();
    }

    goal(x) {
        if (typeof(x)==='string')
            x = this.attn.getElementById(x);
        if (x === undefined) return 0;
        const y = x.data('goal');
        if (y === undefined) return 0;
        return y;
    }

    goalAdd(x, dg, update = false) {

        if (Math.abs(dg) < this.GOAL_EPSILON)
            return;

        var g = x.data('goal');
        if (g === undefined) g = 0;
        g += dg;
        if (g > +1) g = +1;
        else if (g < -1) g = -1;
        x.data('goal', g);
        if (update)
            this.spread();
    }

    interestIcon(x, rank, attn) {
        const rx = rank(x);
        const xid = x.id();
        const icon = $('<div>').text(xid)
            .addClass('interestIcon').addClass('buttonlike')
            .css('font-size', `${Math.min(150, 100 * Math.log(1 + rx * 1E3))}%`);

        const ctl = $('<div>');
        x.data('icon', icon);

        const clearButton = $('<button>').text('x').click(()=>{
            if (x.data('specified')) {
                x.data('specified', false); //TODO removeData
                //TODO disable 'x'
                this.spread();
                clearButton.hide();
            }
        });
        clearButton.hide();

        ctl.append(
            $('<button>').text('+').click(()=>{
                x.data('specified', true);
                this.goalAdd(x, +0.25, true);
                clearButton.show();
            })
        ).append(
            $('<button>').text('-').click(()=>{
                x.data('specified', true);
                this.goalAdd(x, -0.25, true);
                clearButton.show();
            })
        ).append(
            clearButton
        );
        icon.prepend(ctl);

        /*
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
            switch(goal) {
                case -2: icon.css('background-color', '#922'); break;
                case -1: icon.css('background-color', '#600'); break;
                case  0: icon.css('background-color', 'transparent'); break;
                case +1: icon.css('background-color', '#060'); break;
                case +2: icon.css('background-color', '#292'); break;
            }

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
        */



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

    link(x, y, cfg) {
        // if (this.interests.get(i))
        //     return; //ignore duplicate

        //console.log(x, y);
        let div = document.createElement("button");
        div.innerHTML = y;
        //$(div).append($('<a>').text(id));
        //$(div).click(()=>{console.log(this);});

        //div.classList = ['my-cy-node'];
        //div.style.margin = '10px';
        div.style.width = `${Math.floor(Math.random() * 40) + 60}px`;
        div.style.height = `${Math.floor(Math.random() * 30) + 50}px`;

        this.attn.add([
            { group: 'nodes', data: { id: x } },
            { group: 'nodes', data: { id: y, dom:div } },
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