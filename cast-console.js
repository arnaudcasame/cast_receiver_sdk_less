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
        this.ui_.printLine(event.detailedErrorCode, event.type, this.getDetailedErrorMessage(event.detailedErrorCode, event.reason), 1);
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

    getDetailedErrorMessage(detailedErrorCode, reason){
        var message = '';
        switch(detailedErrorCode){
            case cast.framework.events.DetailedErrorCode.APP:
                message = 'An error occurs outside of the framework (An event handler probably threw an error).';
                break;
            case cast.framework.events.DetailedErrorCode.BREAK_CLIP_LOADING_ERROR:
                message = 'The break clip load interceptor failed.';
                break;
            case cast.framework.events.DetailedErrorCode.BREAK_SEEK_INTERCEPTOR_ERROR:
                message = 'The break seek interceptor failed.';
                break;
            case cast.framework.events.DetailedErrorCode.DASH_INVALID_SEGMENT_INFO:
                message = 'The DASH manifest contains invalid segment info.';
                break;
            case cast.framework.events.DetailedErrorCode.DASH_MANIFEST_NO_MIMETYPE:
                message = 'The DASH manifest is missing a MimeType';
                break;
            case cast.framework.events.DetailedErrorCode.DASH_MANIFEST_NO_PERIODS:
                message = 'The DASH manifest is missing periods.';
                break;
            case cast.framework.events.DetailedErrorCode.DASH_MANIFEST_UNKNOWN:
                message = 'An unknown error occured while parsing the DASH manifest.';
                break;
            case cast.framework.events.DetailedErrorCode.DASH_NETWORK:
                message = 'An unknown network error occured while handling a DASH stream.';
                break;
            case cast.framework.events.DetailedErrorCode.DASH_NO_INIT:
                message = 'A DASH stream is missing an init.';
                break;
            case cast.framework.events.DetailedErrorCode.GENERIC:
                message = 'An unknown error occured.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_MANIFEST_MASTER:
                message = 'An error occured while parsing an HLS master manifest.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_MANIFEST_PLAYLIST:
                message = 'An error occured while parsing an HLS playlist.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_INVALID_SEGMENT:
                message = 'An HLS segment is invalid.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_KEY_LOAD:
                message = 'A request for an HLS key failed before it was sent.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_MASTER_PLAYLIST:
                message = 'The HLS master playlist fails to download.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_NO_KEY_RESPONSE:
                message = 'An HLS key failed to download.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_NETWORK_PLAYLIST:
                message = 'An HLS playlist failed to download.';
                break;
            case cast.framework.events.DetailedErrorCode.HLS_SEGMENT_PARSING:
                message = 'An HLS segment failed to parse.';
                break;
            case cast.framework.events.DetailedErrorCode.IMAGE_ERROR:
                message = 'An image failed to load.';
                break;
            case cast.framework.events.DetailedErrorCode.LOAD_FAILED:
                message = 'A load command failed.'
                break;
            case cast.framework.events.DetailedErrorCode.LOAD_INTERRUPTED:
                message = 'A load was interrupted by an unload, or by another load.';
                break;
            case cast.framework.events.DetailedErrorCode.MANIFEST_UNKNOWN:
                message = 'An unknown error occured while parsing a manifest.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_NETWORK:
                message = 'There is a media keys failure due to a network issue.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_UNKNOWN:
                message = 'There is an unknown error with media keys.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_UNSUPPORTED:
                message = 'MediaKeySession object cannot be created.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIAKEYS_WEBCRYPTO:
                message = 'A MediaKey Web crypto failed.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_ABORTED:
                message = 'The fetching process for the media resource was aborted by the user agent at the user\'s request.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_DECODE:
                message = 'An error occurred while decoding the media resource, after the resource was established to be usable.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_ERROR_MESSAGE:
                message = 'An error message was sent to the sender.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_NETWORK:
                message = 'A network error caused the user agent to stop fetching the media resource, after the resource was established to be usable.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_SRC_NOT_SUPPORTED:
                message = 'The media resource indicated by the src attribute was not suitable.';
                break;
            case cast.framework.events.DetailedErrorCode.MEDIA_UNKNOWN:
                message = 'The HTMLMediaElement threw an error, but CAF did not recognize the specific error.';
                break;
            case cast.framework.events.DetailedErrorCode.NETWORK_UNKNOWN:
                message = 'There was an unknown network issue.';
                break;
            case cast.framework.events.DetailedErrorCode.SEGMENT_NETWORK:
                message = 'A segment failed to download.';
                break;
            case cast.framework.events.DetailedErrorCode.SEGMENT_UNKNOWN:
                message = 'An unknown segment error occured.';
                break;
            case cast.framework.events.DetailedErrorCode.SMOOTH_MANIFEST:
                message = 'An error occured while parsing a Smooth manifest.';
                break;
            case cast.framework.events.DetailedErrorCode.SMOOTH_NETWORK:
                message = 'An unknown network error occured while handling a Smooth stream.';
                break;
            case cast.framework.events.DetailedErrorCode.SMOOTH_NO_MEDIA_DATA:
                message = 'A Smooth stream is missing media data.';
                break;
            case cast.framework.events.DetailedErrorCode.SOURCE_BUFFER_FAILURE:
                message = 'A source buffer could not be added to the MediaSource.';
                break;
            case cast.framework.events.DetailedErrorCode.TEXT_UNKNOWN:
                message = 'An unknown error occurred with a text stream.';
                break;
        }
        return message;
    }
}