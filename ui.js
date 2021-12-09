class UI {
    constructor() {
        this.uiBuilder_ = new UIBuilder();
        this.console_ = this.uiBuilder_.getElementById('console-wrapper')
                .getResult();
        this.tabsHolder_ = this.uiBuilder_
                .reset()
                .createElement('div')
                .addIdName('tabs-holder')
                .appendTo(this.console_)
                .getResult();
        this.consolesHolder_ = this.uiBuilder_.reset()
                .createElement('div')
                .addIdName('consoles-holder')
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
                        .addClassName('tab')
                        .appendTo(this.tabsHolder_)
                this.uiBuilder_.reset()
                        .createElement('div')
                        .addClassName('console')
                        .setAttribute('id', id)
                        .appendTo(this.consolesHolder_)
            }
        }
    }
}