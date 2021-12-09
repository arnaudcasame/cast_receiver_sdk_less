class UI {
    constructor() {
        this.uiBuilder_ = new UIBuilder();
        this.console_ = this.uiBuilder_.getElementById('watermark_wrapper')
                .setStyle('position', 'absolute')
                .setStyle('left', '0px')
                .setStyle('bottom', '0px')
                .setStyle('right', '0px')
                .setStyle('height', '50vh')
                // .setStyle('opacity', '0.5')
                .setStyle('display', 'flex')
                .setStyle('flex-direction', 'column')
                .setStyle('z-index', '99')
                .setStyle('background-color', 'black')
                .setStyle('color', 'white')
                .setStyle('font-size', 'xx-large')
                .setStyle('text-align', 'center')
                .getResult();
        this.consolesHolder_ = this.uiBuilder_.reset()
                .createElement('div')
                .setStyle('border', '1px solid white')
                .setStyle('position', 'relative')
                .appendTo(this.console_)
                .getResult();
        this.tabHolder_ = this.uiBuilder_
                .reset()
                .createElement('div')
                .setStyle('display', 'flex')
                .setStyle('background-color', 'green')
                .setStyle('flex-direction', 'row')
                .appendTo(this.console_)
                .getResult();
        this.tabsMetadata = {
            logs: 'Logs',
            errors: 'Errors'
        };
        this.buildTabs();
    }

    getConsole(){
        return this.consolesHolder_;
    }

    buildConsole(){
        
    }

    buildTabs(){
        for (const id in this.tabsMetadata) {
            if (Object.hasOwnProperty.call(this.tabsMetadata, id)) {
                const name = this.tabsMetadata[id];
                this.uiBuilder_.reset()
                        .createElement('div')
                        .addTextValue(name)
                        .setStyle('padding', '5px 10px')
                        .appendTo(this.tabHolder_)
                this.uiBuilder_.reset()
                        .createElement('div')
                        .setAttribute('id', id)
                        .setStyle('width', '100%')
                        .setStyle('position', 'absolute')
                        .appendTo(this.consolesHolder_)
            }
        }
    }
}