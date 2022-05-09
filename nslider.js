"use strict";

/** TODO bipolar +/- option */
function NSlider(opt) {

    opt = opt || { };

    opt = {
        onChange: opt.onChange,
        onRelease: opt.onRelease,
        onPress: opt.onPress
    };

    /** value */
    var p;

    var slider = $('<div>&nbsp;</div>').addClass('zoomSlider');

    var bar = $('<span>&nbsp;</span>').addClass('bar').appendTo(slider);

    bar.css({
        height: '100%',
        position: 'relative',
        left: 0, top: 0,
        backgroundColor: 'blue'
    });

    var mousedown = false;

    const update = e => {
        var s = slider;
        var px = s.offset().left;
        var x = e.clientX - px;

        p = (parseFloat(x) / parseFloat(s.width()));

        var cr = parseInt(255.0 * p);
        var cg = parseInt(25.0);
        var cb = parseInt(255.0 * (1.0 - p));

        setTimeout(() => {
            bar.css({
                width: x + 'px',
                backgroundColor: 'rgb(' + cr + ',' + cg + ',' + cb + ')'
            });
        },0);

        if (opt.onChange)
            opt.onChange(p, slider);

        return p;
    };

    slider.mouseup(e => {
        var p = update(e);
        mousedown = false;

        if (opt.onRelease)
            opt.onRelease(p, slider);

        return false;
    });

    slider.mousedown(e => {
        if (e.which === 1) {
            mousedown = true;

            if (opt.onPress)
                opt.onPress(p, slider);
        }
        return false;
    });

    slider.mousemove(e => {
        if (e.which === 0)
            mousedown = false;

        if (mousedown)
            update(e);
    });

    return slider;
}
