class Menu /* extends View */ {
    
    constructor(elementID) {
        this.ele = $("#" + elementID);
        $.sidebarMenu(this.ele);
        this.activeIcon = null;
        this.active = null;
    }

    addMenu(icon, content) {
        const i = $('<a>').text(icon);
        // i.click(()=>{
        //     if (this.active) {
        //         this.active.remove();
        //         this.active = null;
        //     }
        //     if (this.activeIcon !== i) {
        //         this.ele.after(this.active = $('<div class="popup">').append(content()));
        //         if (this.activeIcon!=null)
        //             this.activeIcon.removeClass('menuActive');
        //         i.addClass('menuActive');
        //         this.activeIcon = i;
        //     } else {
        //         i.removeClass('menuActive');
        //         this.activeIcon = null; //hide
        //     }
        // });
        const j = $('<li>').append(i);
        const u = $('<ul>').addClass('sidebar-submenu').append(content());
        u.hide();
        j.append(u);
        this.ele.append(j);
    }
}