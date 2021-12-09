class UI {
    constructor() {
        this.uiBuilder_ = new UIBuilder();
        this.waterMark_ = this.uiBuilder_.getElementById('watermark_wrapper')
        .setStyle('position', 'absolute')
        .setStyle('left', '0px')
        .setStyle('top', '50px')
        .setStyle('right', '0px')
        .setStyle('opacity', '0.5')
        .setStyle('z-index', '99')
        .setStyle('background-color', 'white')
        .setStyle('color', 'black')
        .setStyle('font-size', 'xx-large')
        .setStyle('text-align', 'center')
        .getResult();
    }

    getWaterMark(){
        return this.waterMark_;
    }
}