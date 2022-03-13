class Menu {
    
    constructor(elementID) {
        this.ele = $("#" + elementID);
        this.activeIcon = null;
        this.active = null;
    }

    addMenu(icon, content) {
        const i = $('<span>').text(icon);
        i.click(()=>{
            if (this.active) {
                this.active.remove();
                this.active = null;
            }
            if (this.activeIcon !== i) {
                this.ele.append(this.active = $('<div>').append(content()));
                i.addClass('menuActive');
                this.activeIcon = i;
            } else {
                i.removeClass('menuActive');
                this.activeIcon = null; //hide
            }
        });
        this.ele.append(i);
    }
}