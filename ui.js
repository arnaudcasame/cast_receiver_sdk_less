class UI {
    constructor() {
        this.uiBuilder_ = new UIBuilder();
        this.waterMark_ = this.uiBuilder_.getElementById('watermark_wrapper')
        .setStyle('position', 'absolute')
        .setStyle('left', '0px')
        .setStyle('bottom', '0px')
        .setStyle('right', '0px')
        .setStyle('height', '50vh')
        .setStyle('opacity', '0.5')
        .setStyle('z-index', '99')
        .setStyle('background-color', 'black')
        .setStyle('color', 'white')
        .setStyle('font-size', 'xx-large')
        .setStyle('text-align', 'center')
        .getResult();
    }

    getWaterMark(){
        return this.waterMark_;
    }
}