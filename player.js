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
    // this.waterMark_ = this.ui_.getWaterMark();
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
        });
    
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
    if (!event.timedMetadataInfo) {
      return;
    }
    if (event.timedMetadataInfo.dashTimedMetadata &&
        event.timedMetadataInfo.dashTimedMetadata.eventElement) {
    }
  }

  handleErrorEvent_(event){
    console.log(event);
    let msg = '{';
    msg += ' detailedErrorCode: ' + event.detailedErrorCode + ', ';
    msg += ' reason: ' + event.reason + ', ';
    for (const key of Object.keys(event.error)) {
      msg += key + ': { ';
      for (const key2 of Object.keys(event.error[key])) {
        msg +=  key2 + ': ' + event.error[key][key2] + ', ';
      }
      msg += '}, ';
    }
    msg += '}';
    this.broadcast(msg);
    this.ui_.printLine(event.detailedErrorCode, 'event', event.reason, 0);
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
    console.log(message);
    this.castContext_.sendCustomMessage(NAMESPACE, undefined, message);
  }
}
