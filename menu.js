class Menu /* extends View */ {
    
    constructor(elementID) {
        this.ele = $("#" + elementID);
        this.activeIcon = null;
        this.active = null;
    }

    addMenu(icon, content) {
        const i = $('<div>').text(icon);
        i.click(()=>{
            if (this.active) {
                this.active.remove();
                this.active = null;
            }
            if (this.activeIcon !== i) {
                this.ele.after(this.active = $('<div class="popup">').append(content()));
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