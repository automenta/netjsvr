class Focus {

    constructor() {
        this.layers = [];
        /* DEPRECATED */
        this.view = null;

        const attn = cytoscape({
            headless: true

            // container: document.getElementById('overlay'),
            // style: [{
            //     selector: 'node',
            //     style: {
            //         //'label': 'data(id)',
            //         //'background-color': '#666',
            //         'background-opacity': 0,
            //         'width': x => {
            //             return 10 * (1 + Math.log(1 + x.outdegree() / 1));
            //         },
            //         'height': x => {
            //             return 10 * (1 + Math.log(1 + x.outdegree() / 1));
            //         }
            //     }
            // }]
        });
        //if (!headless)  attn.domNode();

        attn.attnUpdated = _.debounce(() => {

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


            a/*attn*/.nodes().forEach(x => {
                //console.log(x, x.outdegree());
                const d = x.outdegree();
                //if (d===0)
                if (d <= 1) {
                    x.style('display', 'none');
                    $(x.data('dom')).remove();

                }

            });


            //console.log(attn);
            //TODO stop any previous layout?
            try {
                attn.layout({
                    //name: 'grid'
                    //name: 'cose'//, numIter: 50,  coolingFactor: 0.999, animate: false
                    name: 'breadthfirst', circle: true, nodeDimensionsIncludeLabels: true
                }).run();
            } catch (e) {
            }
            // attn.layout({
            //     //name: 'grid'
            //     name: 'cose', numIter: 50,  coolingFactor: 0.999, animate: false, randomize:false
            //     //name: 'breadthfirst', circle: true/*, nodeDimensionsIncludeLabels: true*/
            // }).run();

        }, 1000);
        this.attn = attn;

        this.GOAL_EPSILON = 0.01;

        this.spread = _.debounce(() => {
            this._update();
        }, 100);


        //const updatePeriodMS = 200;
        //this.running = setInterval(this.run, updatePeriodMS);
    }

    graphView(elementID) {
        //TODO
        const v = cytoscape({
            //headless:true
            container: document.getElementById(elementID),
            style: [ // the stylesheet for the graph
                {
                    selector: 'node',
                    style: {
                        //'label': 'data(id)',
                        //'background-color': '#666',
                        'background-opacity': 0,
                        'width': x => {
                            return 10 * (1 + Math.log(1 + x.outdegree() / 1));
                        },
                        'height': x => {
                            return 10 * (1 + Math.log(1 + x.outdegree() / 1));
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
        v.domNode();
        return v;
    }

    /** spreading activation iteration */
    _update() {

        const inRate = 0.25, outRate = 0.5, selfRate = 0.25, iters = 10;

        for (var iter = 0; iter < iters; iter++) {
            this.attn.nodes().forEach(x => {
                if (x.data('specified')) return; //dont modify, set by user

                var v = 0, sum = 0;

                v += this.goal(x) * selfRate;
                sum += selfRate;

                const I = x.indegree(), O = x.outdegree();
                //TODO reverse this
                if (I > 0) {
                    //TODO double-buffer
                    x.incomers().nodes().forEach(y => {
                        const gy = this.goal(y);
                        v += gy * inRate;
                        sum += inRate;
                    });
                }
                if (O > 0) {
                    x.outgoers().nodes().forEach(y => {
                        const gy = this.goal(y);
                        v += gy * outRate;
                        sum += outRate;
                    });
                }
                const vv = sum === 0 ? 0 : v / sum;
                //console.log(x, vv);
                this.goalSet(x, vv);
            });
        }

        this.attn.nodes().forEach(x => {
            var icon = x.data('icon');
            if (!icon) return;

            icon = $(icon);
            const gx = this.goal(x);
            const _green = Math.max(gx, 0);
            const _red = Math.max(-gx, 0);
            const iconColorIntensity = 0.5;
            const green = parseInt(_green * 256 * iconColorIntensity);
            const red = parseInt(_red * 256 * iconColorIntensity);
            const blue = 0;
            icon.css('background-color', 'rgba(' + red + ',' + green + ',' + blue + ', 1)');
            this.attn.elements().dfs({
                roots: x, //attn.getElementById(xid),
                directed: true,
                visit: (v, e, u, i, depth) => {
                    const V = v.data('instance');
                    if (V && V.renderables) {
                        _.forEach(V.renderables, r => {
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
        });
        this.view.redraw();
    }

    goal(x) {
        if (typeof (x) === 'string')
            x = this.attn.$id(x);
        if (x === undefined) return 0;
        const y = x.data('goal');
        if (y === undefined) return 0;
        return y;
    }

    goalSet(x, value) {
        x.data('goal', value);
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

    interestIcon(x) {
        //const rx = rank(x);
        const icon = $('<div>').text(x)
            .addClass('interestIcon').addClass('buttonlike')
        //.css('font-size', `${Math.min(150, 100 * Math.log(1 + rx * 1E3))}%`);

        const ctl = $('<div>');
        //x.data('icon', icon);

        const clearButton = $('<button>').text('x');
        clearButton.click(() => {
            const X = this.attn.$id(x);
            if (X.data('specified')) {
                X.data('specified', false); //TODO removeData
                //TODO disable 'x'
                this.spread();
                clearButton.hide();
            }
        });
        clearButton.hide();

        ctl.append(
            $('<button>').text('+').click(() => this.add(x, +0.25, clearButton))
        ).append(
            $('<button>').text('-').click(() => this.add(x, -0.25, clearButton))
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


        return icon;
        //return $('<div>').addClass('interestGroup').append(icon);
    }

    add(x, d, clearButton) {
        const X = this.attn.$id(x);
        X.data('specified', true);
        this.goalAdd(X, d, true);
        clearButton.show();
    }

    run() {
        _.forEach(this.layers, x => {
            x.update(this);
        });
    }

    position(lat, lon, alt) {
        const pos = this.view.pos();
        if (lat && lon && alt) {
            // if (pos.latitude!==lat || pos.longitude!==lon || pos.altitude!==alt) {
            //cam.tilt = 45;
            pos.latitude = lat;
            pos.longitude = lon;
            pos.altitude = alt;
            this.layers.forEach(l => l.position(pos));
            // }
        }
        return pos;
    }

    cam() {
        return this.view.w.camera; //HACK
    }

    link(x, y, cfg) {
        // if (this.interests.get(i))
        //     return; //ignore duplicate

        //console.log(x, y);
        this.addInterest(y);
        this.addInterest(x);

        //TODO add edges (and div's) only if not already present


        this.attn.add([
            {group: 'edges', data: { /*id: x + '__' + y,*/ source: y, target: x}}
        ]);

        //TODO only if graph actually changed
        this.attn.attnUpdated();

    }

    addInterest(x) {
        if (this.attn.$id(x).length)
            return; //already added

        const div = this.nodeDiv(x);

        this.attn.add([{group: 'nodes', data: {id: x, dom: div}}]);

        this.attn.$id(x).data('icon', div);
    }

    nodeDiv(x) {
        const div = document.createElement("div");
        $(div).append(x);
        //$(div).append($('<button>').text('+'), $('<button>').text('-'));
        $(div).append(this.interestIcon(x, () => 1));

        //$(div).append($('<a>').text(id));
        //$(div).click(()=>{console.log(this);});

        //div.classList = ['my-cy-node'];
        //div.style.width = `${Math.floor(Math.random() * 40) + 60}px`;
        //div.style.height = `${Math.floor(Math.random() * 30) + 50}px`;
        //div.style.opacity = 0.5;
        //div.style.margin = '10px';
        return div;
    }

    addLayer(layer) {
        this.layers.push(layer);

        if (layer.enabled === undefined)
            layer.enable(); //default state

        layer.position(this.position());

        layer.start(this);
    }

    removeLayer(layer) {
        layer.element.remove();
        delete layer.element;

        this.layers = _.filter(this.layers, x => x !== layer);
        layer.stop(this);
    }

    updateMenu(m) {
        const k = this.attn.elements().kruskal();

        const roots = k.nodes().filter(n => n.indegree() <= 0);

        roots.forEach(n => {
            const id = n.data('id');
            m.addMenu(id, () => {
                const d = $('<div>');

                d.append(this.interestIcon(id));

                //TODO hierarchical, not flattened:
                n.successors().forEach(s => {
                    if (s.outdegree() > 1) {
                        d.append(this.interestIcon(s.data('id')))
                    }
                });

                return d;
            });
        });

    }
}