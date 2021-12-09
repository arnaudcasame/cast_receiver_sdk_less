import { UIBuilder } from "./ui-builder";

class UI {
    constructor() {
        this.uiBuilder_ = new UIBuilder();
        this.waterMark_ = this.uiBuilder.getElementById('watermark_wrapper')
        .setAttribute('position', 'absolute')
        .setAttribute('left', '0px')
        .setAttribute('top', '50px')
        .setAttribute('right', '0px')
        .setAttribute('opacity', '0.5')
        .setAttribute('z-index', '99')
        .setAttribute('background-color', 'white')
        .setAttribute('color', 'black')
        .setAttribute('font-size', 'xx-large')
        .setAttribute('text-align', 'center')
        .getResult();
    }

    getWaterMark(){
        return this.waterMark_;
    }
}