/**
 * A class that builds the UI elements.
 */
 class UIBuilder {
    /**
     * Initializes the ui builder class
     */
    constructor(){
        /** @private @const {!HTMLElement} */
        this.element_ = null;
    }
    
    /**
     * Creates an HTML Element and sets its attributes
     * @param {String} tagName name of the HTML Element to be created
     * @returns {UIBuilder} returns the UIBuilder instance
     */
    createElement(tagName){
        this.element_ = document.createElement(tagName);
        return this;
    }

    /**
     * Adds class name to created element
     * @param {String} className class name of the HTML Element to be created
     * @returns {UIBuilder} returns the UIBuilder instance
     */
    addClassName(className){
        this.element_.setAttribute('class', className);
        return this;
    }

    /**
     * Adds id to created HTML element
     * @param {String} id of the HTML Element to be created
     * @returns {UIBuilder} returns the UIBuilder instance
     */
    addIdName(id){
        this.element_.setAttribute('id', id);
        return this;
    }

    /**
     * Adds the text value to the created HTML element
     * @param {String} text to be displayed by the created HTML Element
     * @returns {UIBuilder} returns the UIBuilder instance
     */
    addTextValue(text){
        this.element_.innerText = text || '';
        return this;
    }

    /**
     * Adds the HTML value to the created HTML element
     * @param {String} html text version to be displayed by the created HTML Element
     * @returns {UIBuilder} returns the UIBuilder instance
     */
     addHTMLValue(html){
        this.element_.innerHTML = html || '';
        return this;
    }

    /**
     * Gets the result of the created element
     * @returns the element that was created
     */
    getResult(){
        return this.element_;
    }

    /**
     * Resets the HTML element created
     * @returns {UIBuilder} returns the instance of the UIBuilder
     */
    reset(){
        this.element_ = null;
        return this;
    }

    /**
     * Sets any attribute of the current created HTML element
     * @param {String} name The attribute name to set
     * @param {String} value The value that will be assigned to the attribute
     * @returns 
     */
    setAttribute(name, value){
        this.element_.setAttribute(name, value);
        return this;
    }

    getElementById(id){
        this.element_ = document.getElementById(id);
        return this;
    }

    setStyle(name, value){
        this.element_.style[name] = value;
        return this;
    }

    /**
     * Appends currently created element to the given container
     * @param {HTMLElement} container the HTML element that holds the created HTML element
     */
    appendTo(container){
        container.appendChild(this.element_);
        return this;
    }
    
}