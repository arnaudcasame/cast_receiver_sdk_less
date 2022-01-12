const NAMESPACE = 'urn:x-cast:com.google.ads.arnaudc.cast';

class Player {
  /**
   * Represents the receiver
   * @param {!Object} mediaElement - the cast media player element
   */
  constructor(mediaElement) {
    /**
     * the fallback stream to play if loading fails
     * @type {string}
     * @private
     * @const
     */
    this.backupStream_ = 'https://storage.googleapis.com/testtopbox-public/video_content/bbb/master.m3u8';

    /**
     * the cast context object provided by the CAF framework.
     * @type {!Object}
     * @private
     * @const
     */
    this.castContext_ = cast.framework.CastReceiverContext.getInstance();

    /**
     * the player manager object, provided by the CAF framework.
     * @type {!Object}
     * @private
     * @const
     */
    this.playerManager_ = this.castContext_.getPlayerManager();

    /**
     * the video player contained within the cast media player element.
     * @type {!HTMLMediaElement}
     * @private
     * @const
     */
    this.mediaElement_ = mediaElement.getMediaElement();

    /**
     * This is the stream manager object for IMA SDK.
     * @type {?Object}
     * @private
     */
    this.streamManager_ = null;

    /**
     * Stores the timestamp where playback will start, in seconds, for
     * bookmarking.
     * @type {number}
     * @private
     */
    this.startTime_ = 0;

    this.ui_ = new UI();
    // setInterval(()=>{
    //   this.ui_.printLine('code', 'event', 'message', 0);
    // }, 2000);
  }

  /** Initializes CAF */
  initialize() {
    // Map of namespace names to their types.
    const options = new cast.framework.CastReceiverOptions();
    options.customNamespaces = {};
    options.customNamespaces[NAMESPACE] =
        cast.framework.system.MessageType.STRING;
    this.castContext_.start(options);
  }

  /** Attaches event listeners and other callbacks. */
  setupCallbacks() {
    // Receives messages from sender app.
    this.castContext_.addCustomMessageListener(NAMESPACE, (event) => {
      this.processSenderMessage_(event.data);
    });
    console.log(cast.framework.messages);
    console.log(cast.framework.events);
    this.attachPlayerManagerCallbacks_();
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
      case 'bookmark':
        const time = parseFloat(messageArray[1]);
        const bookmarkTime = this.streamManager_.contentTimeForStreamTime(time);
        this.broadcast('bookmark,' + bookmarkTime);
        this.bookmark(time);
        break;
      case 'getContentTime':
        const contentTime = this.getContentTime();
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
   * Attaches message interceptors and event listeners to connet IMA to CAF.
   * @private
   */
  attachPlayerManagerCallbacks_() {
    // This intercepts the CAF load process, to load the IMA stream manager and
    // make a DAI stream request. It then injests the stream URL into the
    // original LOAD message, before passing it to CAF
    this.playerManager_.setMessageInterceptor(
        cast.framework.messages.MessageType.LOAD, (request) => {
          return this.initializeStreamManager_(request);
        });

    // This intercepts CAF seek requests to cancel them in the case that an ad
    // is playing, and to modify them to enable snapback
    this.playerManager_.setMessageInterceptor(
        cast.framework.messages.MessageType.SEEK, (seekRequest) => {
          return this.processSeekRequest_(seekRequest);
        });

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
  }

  /**
   * initializes the IMA StreamManager and issues a stream request.
   * @param {!Object} request - The request data object from the CAF sender
   * @return {!Promise<!Object>} - The request object with added stream
   *     information
   * @private
   */
  initializeStreamManager_(request) {
    return new Promise((resolve, reject) => {
      // this.broadcast('Stream request failed. Loading backup stream...');
      const fromSender = request.media.customData;
      // this.waterMark_.innerHTML = fromSender.title;
      this.broadcast('Stream request successful. Loading stream...');
      request.media.contentUrl = fromSender.streamUrl;
      request.media.hlsSegmentFormat = cast.framework.messages.HlsSegmentFormat.TS;
      request.media.hlsVideoSegmentFormat = cast.framework.messages.HlsSegmentFormat.MPEG2_TS;
      resolve(request);

      document.getElementById('splash').style.display = 'none';
    });
  }

  /**
   * Intercepts requests to seek and injects necessary information for snapback.
   * Also prevents seeking while ads are playing.
   * @param {!Object} seekRequest - A CAF seek request
   * @return {!Object} - A potentially modified CAF seek request
   * @private
   */
  processSeekRequest_(seekRequest) {
    const seekTo = seekRequest.currentTime;
    return seekRequest;
  }

  /**
   * Seeks video playback to specified time if not playing an ad.
   * @param {number} time - The target stream time in seconds, including ads.
   */
  seek(time) {
    if (time > 0) {
      this.mediaElement_.currentTime = time;
      this.broadcast('Seeking to: ' + time);
    }
  }

  /**
   * Sets a bookmark to a specific time on future playback.
   * @param {number} time - The target stream time in seconds, including ads.
   */
  bookmark(time) {
    this.startTime_ = time;
  }

  /**
   * Gets the current timestamp in the stream, not including ads.
   * @return {number} - The stream time in seconds, without ads.
   */
  getContentTime() {
    const currentTime = this.mediaElement_.currentTime;
    return currentTime;
  }

  /**
   * Broadcasts a message to all attached CAF senders
   * @param {string} message - The message to be sent to attached senders
   */
  broadcast(message) {
    // console.log(message);
    this.castContext_.sendCustomMessage(NAMESPACE, undefined, message);
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
}
