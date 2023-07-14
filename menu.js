class Menu /* extends View */ {
    
    constructor(elementID) {
        this.ele = $("#" + elementID);
        $.sidebarMenu(this.ele);
        this.activeIcon = null;
        this.active = null;
    }

    addMenu(icon, content) {
        const i = $('<a>').addClass('label buttonlike').text(icon);
        const u = $('<div>').addClass('sidebar-submenu').append(content());

        i.click(()=>{
            u.show();
            // if (this.active) {
            //     this.active.remove();
            //     this.active = null;
            // }
            // if (this.activeIcon !== i) {
            //     this.ele.after(this.active = $('<div class="popup">').append(content()));
            //     if (this.activeIcon!=null)
            //         this.activeIcon.removeClass('menuActive');
            //     i.addClass('menuActive');
            //     this.activeIcon = i;
            // } else {
            //     i.removeClass('menuActive');
            //     this.activeIcon = null; //hide
            // }
        });

        u.hide();

        this.ele.append($('<div>').addClass('cell').append(i, u));
    }
}