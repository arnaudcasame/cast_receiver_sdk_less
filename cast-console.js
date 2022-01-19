class CastConsole {
    /**
     * Represents the receiver console
     * @param {!Object} castContext - the cast context object
     */
    constructor(castContext){
        /**
         * the cast context object provided by the CAF framework.
         * @type {!Object}
         * @private
         * @const
         */
        this.castContext_ = castContext;

        /**
         * the player manager object, provided by the CAF framework.
         * @type {!Object}
         * @private
         * @const
         */
        this.playerManager_ = this.castContext_.getPlayerManager();

        this.ui_ = new UI();
        // setInterval(()=>{
        //   this.ui_.printLine('code', 'event', 'message', 0);
        // }, 2000);
        this.setupCallbacks_();
    }

    /** Attaches event listeners and other callbacks. */
    setupCallbacks_() {
        // Receives messages from sender app.
        this.castContext_.addCustomMessageListener(NAMESPACE, (event) => {
            this.processSenderMessage_(event.data);
        });
        console.log(cast.framework.messages);
        console.log(cast.framework.events);
        this.attachPlayerManagerCallbacks_();
    }

    /**
     * Attaches message interceptors and event listeners to connet IMA to CAF.
     * @private
     */
    attachPlayerManagerCallbacks_() {
        // This intercepts the CAF load process, to load the IMA stream manager and
        // make a DAI stream request. It then injests the stream URL into the
        // original LOAD message, before passing it to CAF
        // this.playerManager_.setMessageInterceptor(
        //     cast.framework.messages.MessageType.LOAD, (request) => {
        //         return this.initializeStreamManager_(request);
        //     });

        // This intercepts CAF seek requests to cancel them in the case that an ad
        // is playing, and to modify them to enable snapback
        // this.playerManager_.setMessageInterceptor(
        //     cast.framework.messages.MessageType.SEEK, (seekRequest) => {
        //         return this.processSeekRequest_(seekRequest);
        //     });

        // This passes ID3 events from the stream to the IMA to allow for updating
        // stream events on the fly in live streams
        this.playerManager_.addEventListener(
            cast.framework.events.EventType.ID3, (event) => {
                // pass ID3 events from the stream to IMA to update live stream
                // cuepoints
                console.log(cast.framework.events.EventType.ID3, event);
            });

        this.playerManager_.addEventListener(
            cast.framework.events.EventType.ALL, this.handleAllEvents.bind(this));

        this.playerManager_.addEventListener([
            cast.framework.events.EventType.ERROR
        ], (event) => this.handleErrorEvent_(event));

        this.playerManager_.addEventListener(
            [
                cast.framework.events.EventType.TIMED_METADATA_ENTER,
                cast.framework.events.EventType.TIMED_METADATA_CHANGED,
                cast.framework.events.EventType.TIMED_METADATA_EXIT,
            ],
            (event) => this.handleTimedMetadataEvent_(event));
    }

    /**
     * Parses messages from sender apps. The message is a comma separated
     * string consisting of a function name followed by a set of parameters.
     * @param {string} message - The raw message from the sender app.
     * @private
     */
    processSenderMessage_(message) {
        console.log('Received message from sender: ' + message);
        const messageArray = message.split(',');
        const method = messageArray[0];
        switch (method) {
            case 'getContentTime':
                const contentTime = null;
                this.broadcast('contentTime,' + contentTime);
                break;
            case 'TabChange':
                this.ui_.changeTab(parseInt(messageArray[1], 10));
                break;
            case 'ConsoleHeightChange':
                this.ui_.changeConsoleHeight(messageArray[1]);
                break;
            default:
                this.broadcast('Message not recognized');
                break;
        }
    }

    /**
     * Handles timedmetadata updates from the player manager.
     * @param {!cast.framework.events.TimedMetadataEvent} event
     * @private
     */
    handleTimedMetadataEvent_(event) {
        console.log('TIMED_METADATA_EVENT', event);
        if (!event.timedMetadataInfo) {
            return;
        }
        if (event.timedMetadataInfo.dashTimedMetadata &&
            event.timedMetadataInfo.dashTimedMetadata.eventElement) {
        }
    }

    handleErrorEvent_(event){
        console.log(cast.framework.events.EventType.ERROR, event);
        console.log('Media Unknown: ', cast.framework.events);

        let msg = '{';
        msg += ' detailedErrorCode: ' + event.detailedErrorCode + ', ';
        msg += ' reason: ' + event.reason + ', ';
        if(event.error){
            for (const key of Object.keys(event.error)) {
            msg += key + ': { ';
            for (const key2 of Object.keys(event.error[key])) {
                msg +=  key2 + ': ' + event.error[key][key2] + ', ';
            }
            msg += '}, ';
            }
        }
        msg += '}';
        this.broadcast(msg);
        this.ui_.printLine(event.detailedErrorCode, event.type, event.reason, 1);
        this.ui_.printLine(event.detailedErrorCode, event.type, this.getDetailedErrorMessage(event.detailedErrorCode), 1);
    }

    handleAllEvents(event){
        console.log(event.type, event);
        switch (event.type) {
            case cast.framework.events.EventType.MEDIA_STATUS:
                this.handleMediaStatusEvent(event);
                break;
            case cast.framework.events.EventType.REQUEST_FOCUS_STATE:
                const senderId = event.senderId ? 'SenderID: ' + event.senderId : '';
                this.ui_.printLine(null, event.type, 'Cast Player request focus. ' + senderId, 0);
                break;
            case cast.framework.events.EventType.REQUEST_LOAD:
                this.handleRequestLoad(event);
                break;
            case cast.framework.events.EventType.PLAYER_LOADING:
                this.handlePlayerLoading(event);
                break;
            case cast.framework.events.EventType.LOAD_START:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.BITRATE_CHANGED:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.PROGRESS:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.PLAY:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.WAITING:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.DURATION_CHANGE:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.LOADED_METADATA:
                this.handleCommonEvents(event);
                break;
            case cast.framework.events.EventType.SEGMENT_DOWNLOADED:
                this.ui_.printLine(null, event.type, `download time: ${event.downloadTime}`, 0);
                this.ui_.printLine(null, null, `downloaded size: ${event.size/1000} kb`, 0);
                break;
            default:
                break;
        }
    }

    handleMediaStatusEvent(event){
        this.ui_.printLine('', event.type, 'Player State: ' + event.mediaStatus.playerState, 0);
    }

    handleRequestLoad(event){
        this.ui_.printLine(null, event.type, 'SenderId: ' + event.senderId, 0);
        this.ui_.printLine(null, null, 'ContentType: ' + event.requestData.media.contentType, 0);
        this.ui_.printLine(null, null, 'ContentUrl: ' + event.requestData.media.contentUrl, 0);
        this.ui_.printLine(null, null, 'Duration: ' + event.requestData.media.duration, 0);
    }

    handlePlayerLoading(event){
        const message = event.media.customData.title ? `Title: ${event.media.customData.title}, format: ${event.media.customData.format}` : '';
        this.ui_.printLine(null, event.type, message, 0);
    }

    handleCommonEvents(event){
        this.ui_.printLine(null, event.type, `current time: ${event.currentMediaTime}`, 0);
    }

    /**
     * Broadcasts a message to all attached CAF senders
     * @param {string} message - The message to be sent to attached senders
     */
    broadcast(message) {
        // console.log(message);
        this.castContext_.sendCustomMessage(NAMESPACE, undefined, message);
    }

    getDetailedErrorMessage(detailedErrorCode){
        var message = '';
        switch(detailedErrorCode){
            case cast.framework.events.DetailedErrorCode.APP:
                break;
            case cast.framework.events.DetailedErrorCode.BREAK_CLIP_LOADING_ERROR:
                break;
            case cast.framework.events.DetailedErrorCode.BREAK_SEEK_INTERCEPTOR_ERROR:
                break;
            case cast.framework.events.DetailedErrorCode.DASH_INVALID_SEGMENT_INFO:
                break;
            case cast.framework.events.DetailedErrorCode.DASH_MANIFEST_NO_MIMETYPE:
                break;
            case cast.framework.events.DetailedErrorCode.DASH_MANIFEST_NO_PERIODS:
                break;
            case cast.framework.events.DetailedErrorCode.DASH_MANIFEST_UNKNOWN:
                break;
            case cast.framework.events.DetailedErrorCode.DASH_NETWORK:
                break;
            case cast.framework.events.DetailedErrorCode.DASH_NO_INIT:
                break;
            case cast.framework.events.DetailedErrorCode.GENERIC:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_MANIFEST_MASTER:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_MANIFEST_PLAYLIST:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_INVALID_SEGMENT:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_KEY_LOAD:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_MASTER_PLAYLIST:
                message = 'The HLS master playlist fails to download.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_NO_KEY_RESPONSE:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_PLAYLIST:
                break;
            case cast.framework.events.DetailedErrorCode.HLS_SEGMENT_PARSING:
                break;
            case cast.framework.events.DetailedErrorCode.IMAGE_ERROR:
                break;
            case cast.framework.events.DetailedErrorCode.LOAD_FAILED:
                message = 'A load command failed.'
                break;
            case cast.framework.events.DetailedErrorCode.LOAD_INTERRUPTED:
                break;
            case cast.framework.events.DetailedErrorCode.MANIFEST_UNKNOWN:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_NETWORK:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_UNKNOWN:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_UNSUPPORTED:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_WEBCRYPTO:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_ABORTED:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_DECODE:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_ERROR_MESSAGE:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_NETWORK:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_SRC_NOT_SUPPORTED:
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_UNKNOWN:
                break;
            case cast.framework.events.DetailedErrorCode.NETWORK_UNKNOWN:
                break;
            case cast.framework.events.DetailedErrorCode.SEGMENT_NETWORK:
                break;
            case cast.framework.events.DetailedErrorCode.SEGMENT_UNKNOWN:
                break;
            case cast.framework.events.DetailedErrorCode.SMOOTH_MANIFEST:
                break;
            case cast.framework.events.DetailedErrorCode.SMOOTH_NETWORK:
                break;
            case cast.framework.events.DetailedErrorCode.SMOOTH_NO_MEDIA_DATA:
                break;
            case cast.framework.events.DetailedErrorCode.SOURCE_BUFFER_FAILURE:
                break;
            case cast.framework.events.DetailedErrorCode.TEXT_UNKNOWN:
                break;
        }
        return message;
    }
}