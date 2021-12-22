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
        this.consoles_ = [];
        this.tabs_ = [];
        this.buildConsole_();
        this.buildLogsListHolder_();
    }

    buildConsole_(){
        let index = 0;
        for (const id in this.tabsMetadata) {
            const noDisplay = 'none';
            let isActive = ' active';
            if(index > 0){
                isActive = '';
            }
            if (Object.hasOwnProperty.call(this.tabsMetadata, id)) {
                const name = this.tabsMetadata[id];
                const tab_ = this.uiBuilder_.reset()
                        .createElement('div')
                        .addTextValue(name)
                        .addClassName('tab' + isActive)
                        .appendTo(this.tabsHolder_)
                        .getResult();
                const console_ = this.uiBuilder_.reset()
                                    .createElement('div')
                                    .addClassName('console')
                                    .setAttribute('id', id)
                                    .setStyle('display', index === 0 ? 'block' : noDisplay)
                                    .appendTo(this.consolesHolder_)
                                    .getResult();
                this.consoles_.push(console_);
                this.tabs_.push(tab_);
            }
            index++;
        }
    }

    buildLogsListHolder_(){
        for (const console_ of this.consoles_) {
            const list = this.uiBuilder_.reset()
                                .createElement('ul')
                                .setStyle('padding', '0px')
                                .setStyle('margin', '0px')
                                .setStyle('width', '100%')
                                .setStyle('height', '100%')
                                .setStyle('list-style', 'none')
                                .setStyle('overflow-y', 'scroll')
                                .getResult();
            console_.appendChild(list);
        }
    }

    printLine(code, event, message, whichConsole){
        const list = this.consoles_[whichConsole].firstChild;
        this.createLine_(list, {time : this.formatTime_(), event, code, message});
        list.scrollTop = list.scrollHeight;
    }

    changeTab(tabId){
        for (let i = 0; i < this.consoles_.length; i++) {
            const console = this.consoles_[i];
            const tab = this.tabs_[i];
            console.style.display = 'none';
            tab.classList.remove('active');
        }
        this.tabs_[tabId].classList.add('active');
        this.consoles_[tabId].style.display = 'block';
    }

    /**
     * A function that formats the log time in a console manner
     * @returns log time format intelligibly
     */
    formatTime_() {
        let logTime = new Date();
        const milliseconds = logTime.getMilliseconds() < 100 ? "0" + logTime.getMilliseconds() : logTime.getMilliseconds();
        logTime = logTime.toTimeString();
        return logTime.substring(0, logTime.indexOf('GMT') - 1) + ":" + milliseconds;
    }

    createLine_(container, data){
        const listItem = this.uiBuilder_.reset()
                                .createElement('li')
                                .addClassName('list-item')
                                .appendTo(container)
                                .getResult();
        
        for (const key of Object.keys(data)) {
                this.uiBuilder_.reset()
                        .createElement('span')
                        .addTextValue(data[key] ? data[key] : '')
                        .appendTo(listItem);
        }
    }
}