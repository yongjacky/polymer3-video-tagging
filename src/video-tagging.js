/*
       * video-tagging control for video tagging
       * Main file of the video-tagging module.
*/
import {  PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom'

import './video-taggingstyles.js';
import './optional-tags.js';
import './playback-control.js';
import moment from 'moment';
import 'jquery';


class VideoTagging extends PolymerElement {
    static get template() {
        return html`
          <style include="video-taggingstyles"></style>
          
          <link rel="stylesheet" href="css/sliders.css">
          <link rel="stylesheet" href="css/imgareaselect-animated.css">
          <link rel="stylesheet" href="assets/icons/style.css">
          <link rel="stylesheet" href="css/resizable.css">
          <link rel="stylesheet" href="css/bootstrap.min.css">

          <div id="controlWrapper" class="controlWrapper">
             <playback-control id="playSpeedControl" class="playSpeedControl"></playback-control>
             <div id="videoWrapper" class="relativeDiv">
                <div id="regionLabelDiv" style="width:40px;height:20px;" class="regionLabel">
                    <span id="regionLabelSpan" class="regionLabelSpan"></span>
                    <span id="closeRegionImage" on-click="deleteRegion" class="closeRegion clickableControl">X</span>
                </div>
                    <canvas id="overlay" on-click="videoClicked" class="overlaystyle" width="100" height="100">
                            Your browser does not support the HTML5 canvas location.
                    </canvas>
                    <video id="vid" class="videoStyle">
                            Your browser does not support the video location.
                    </video>
              </div>
              <div id="videoControls" class="videoControls">
                    <input id="seekBar" class="seek clickableControl" type="range" min="0" value="0" step="any" onkeydown="return false;" required="">
                    <table id="videoControlsTable" class="videoControlsTable">
                        <tbody><tr>
                        <td class="videoControlCell simpleControl clickableControl">
                            <span id="stepbwd" title="prev" class="icon-backward2 taggingControls" on-click="stepBwdClicked"></span>
                        </td>
                        <td class="videoControlCell simpleControl clickableControl" >
                            <span id="play-pause" title="play/pause" class="icon-play3 taggingControls" on-click="playPauseClicked"></span>
                        </td>
                        <td class="videoControlCell simpleControl clickableControl">
                            <span id="stepfwd" title="next" class="icon-forward3 taggingControls" on-click="stepFwdClicked"></span>
                        </td>
                        <td class="videoControlCell simpleControl clickableControl">
                            <span id="nextuntagged" title="first untagged frame" class="icon-next2 taggingControls" on-click="nextUntaggedClicked"></span>
                        </td>
                        <td class="videoControlCell simpleControl clickableControl">
                            <span id="clearRegions" title="clear tags" class="glyphicon glyphicon-ban-circle taggingControls" on-click="clearRegions"></span>
                        </td>
                        <td id="rotate" class="videoControlCell simpleControl clickableControl" style="display: none">
                            <span title="rotate right" class="glyphicon glyphicon-repeat taggingControls" on-click="rotate"></span>
                        </td>
                        <td class="videoControlCell frameNumber">
                            <span id="frameText" class="textElements" title="frame#"></span>
                        </td>
                        <td id="playSpeedCell" title="play speed" class="videoControlCell longControl clickableControl" style="display: none">
                            <span id="playbackSpan" class="textElements" on-click="playbackSpeedClicked">x 1.0</span>
                        </td>
                        <td nowrap="nowrap" class="videoControlCell simpleControl">
                            <span id="timeSpan" class="textElements"></span>
                        </td>
                        <td class="videoControlCell simpleControl clickableControl" style="display: none">
                            <span id="mute" title="Mute" class="icon-volume-medium taggingControls" on-click="muteClicked"></span>
                        </td>
                        <td class="volumeControlCell longControl" style="display: none">
                            <input id="volumeSlider" class="volume clickableControl" type="range" min="0" max="1" value=".5" step=".1" required="">
                        </td>
                        </tr>
                    </tbody></table>
                </div>
                <div id="videoTagControls" class="videoTagControls">
                    <div class="optionalTags">
                        <div class="optionalTagsWrapper">
                        <optional-tags id="optionalTags"></optional-tags>
                        </div>
                    </div>
                    <div class="labelControls">
                        <span id="emptyFrame" title="empty frame" class="icon-share taggingControls controlOff" on-click="emptyFrameClicked"></span>
                        <span id="lockTag" title="lock tags" class="icon-pushpin taggingControls lockTag controlOff" on-click="lockTagsClicked"></span>
                    </div>
                    <div style="clear: both">
                    </div>
                </div>
           </div>
        `;
    }
    
    static get properties() {
        return {
            framerate: Number,
            videoduration: Number,
            videowidth: Number,
            videoheight: Number,
            regiontype: String,
            multiregions: Number,
            regionsize: Number,
            imagelist: Object,
            inputtagsarray:Object,
            inputframes: Object,
            src: {
                type: String,
                value: '',
                observer: 'videoSrcChanged'
            }
        }
    }

    ready(){
        super.ready();
        this.frames = {}; // Holds the data of the tagged frames, their regions and tags
        this.seeking = false;//Flag for enabling control over the seek bar while the video is playing, see playingCallback function
        this.selectedRegionId = 0;//Holds the current selected region number
        this.lockTagsEnabled = false;
        this.selectedTags = [];
        this.uniqueTagId = 0;
        this.videoStartTime = 0; //sometimes videos don't load at absoultue zero
        this.canMove = true;
        this.imageIndex = 0;
        this.curImg = new Image();
        this.rotation = 0;
        
        //Divs and spans
        this.controlWrapper= dom(this.root).querySelector('#controlWrapper');//this.$.controlWrapper;
        this.videoWrapper= dom(this.root).querySelector('#videoWrapper');//this.$.videoWrapper;
        this.overlay = dom(this.root).querySelector('#overlay');  //this.$.overlay;
        this.video= dom(this.root).querySelector('#vid')//this.$.vid;
        this.optionalTags= this.$.optionalTags;
        this.regionLabelDiv =  this.$.regionLabelDiv;
        this.regionLabelSpan = this.$.regionLabelSpan;
        this.timeSpan = this.$.timeSpan;
        this.frameText = this.$.frameText;
        this.playbackSpan = this.$.playbackSpan;
        // Buttons
        this.playButton = dom(this.root).querySelector('#play-pause');
        
        this.stepfwd = dom(this.root).querySelector("#stepfwd");
        this.stepbwd = dom(this.root).querySelector("#stepbwd");
        this.lockTag = dom(this.root).querySelector("#lockTag");
        this.playSpeedControl = dom(this.root).querySelector("#playSpeedControl");
        this.playSpeedCell = dom(this.root).querySelector("#playSpeedCell");
        this.mute = dom(this.root).querySelector('#mute');
        this.emptyFrame = dom(this.root).querySelector("#emptyFrame");
        this.nextuntagged = dom(this.root).querySelector("#nextuntagged");
        // Sliders
        this.seekBar = dom(this.root).querySelector("#seekBar");
        this.volumeSlider = dom(this.root).querySelector("#volumeSlider");
        //dynamic styles for sliders
        this.volumeStyle = document.createElement('style');
        dom(this.root).appendChild(this.volumeStyle);
        this.seekStyle = document.createElement('style');
        dom(this.root).appendChild(this.seekStyle);
        this.playing = null;
        this.ctx = this.overlay.getContext("2d");
        this.aspect = 0;
        this.snapWidth = 0;

        this.initVideo();

        this.video.addEventListener( "loadedmetadata", this.initVideo);
        let self=this;
        this.video.onended = ()=>{
            self.pauseState();
        };

        this.seekBar.addEventListener("mousedown", ()=> {
          self.seeking = true;
        });
    
        this.seekBar.addEventListener("mouseup", ()=> {
          self.seeking = false;
        });

        this.seekBar.addEventListener("change", ()=>{
          if (!this.imagelist){
               self.seeking = false;
               self.video.currentTime =  Math.floor(self.seekBar.value/self.frameTime) * self.frameTime;//keep the frame in sync
          }
          self.playingCallback();
        });
        
        this.volumeSlider.addEventListener("change", ()=> {
          if (!this.imagelist){
              self.video.volume = self.volumeSlider.value;
              let perc =  100 * self.volumeSlider.value / self.volumeSlider.max;
              self.volumeStyle.textContent = '.volume::-webkit-slider-runnable-track{background-size:'+ perc +'% 100%} ';
              self.volumeStyle.textContent += '.volume::-moz-range-track{background-size:'+ perc +'% 100%} ';
          }
        });
        
        this.addEventListener("playSpeedSelected", (e)=> {
          self.playback(e.detail.playbackValue, e.detail.playbackText);
        });
        
        this.addEventListener("ontagsubmitted", (e)=> {
            let arr = [];
            arr.push(e.detail.tagid);
            this.addTagsToRegion(arr);
            this.emitRegionToHost();//Persist
        });
        
        this.addEventListener("ontagdeleted", function(e) {
            let regionId = this.selectedRegionId -1;//Revert to zero-based array
            let region = this.frames[this.getCurrentFrame()][regionId];
            for(let index = 0;index < region.tags.length;index++){
                  if(region.tags[index] === e.detail.tagid){
                      region.tags.splice(index, 1);
                      break;
                  }
            }
            this.emitRegionToHost();
        });
    }  

    initVideo(){
        
        this.controlWrapper.style.display = "block";
        //Init variables and controls
        this.frames = this.inputframes? this.inputframes:{};
        this.frameTime = 1/this.framerate;
        this.enableAreaSelect(this);
        this.optionalTags.createTagControls(this.inputtagsarray);
        //Take the raw video aspect ratio
        this.aspect = this.video.offsetWidth / this.video.offsetHeight;
        //Init sliders
        this.volumeSlider.value = 0.5;
        this.seekBar.max = this.video.duration;
        this.playingCallback();
        this.overlay.width = this.video.offsetWidth;
        this.overlay.height = this.video.offsetHeight;

        let self = this;
        //fix resize bug
        $(window).resize( ()=>{
            if (self.video.offsetWidth !== undefined){
                // self.snapToAspectRatio();
                //get transform ratio
                let transformWidth =  self.video.offsetWidth/self.overlay.width;
                let transformHeight = self.video.offsetHeight/self.overlay.height;
                //resize the overlay
                self.overlay.width = self.video.offsetWidth;
                self.overlay.height = self.video.offsetHeight;
                //resize the region boxes
                self.showAllRegions();
                //reposition selectedRegion Label
                let selectedDiv = $('.regionCanvasSelected')[0];
                self.positionRegionNameLabel(selectedDiv);
            }
        });
        //bind keys (note this currently overrides any listener on the parent controls needs a more elegant way to work only when control is in focus)
        window.addEventListener("keydown", ((canMove)=> {
            return function(e) {
                if (!canMove) return false;
                canMove = false;
                setTimeout(function() { canMove = true; }, 100);
                switch (e.keyCode) {
                    case 37:  // left
                    self.stepBwdClicked();
                    break;
                    case 39: // right
                    self.stepFwdClicked();
                    break;
                    case 46: //delete
                    case 8:  //backspace
                    if($('.regionCanvasSelected')[0]){
                        self.deleteRegion();
                    }
                    break;
                    default: return; // exit this handler for other keys
                }
                e.preventDefault(); // prevent the default action (scroll / move caret)
            };
        })(true), false);
    }

    attached(){
        console.log('attached')
        //Reset all variables to new src
        this.video.addEventListener( "loadedmetadata", init);
        let self = this;

        function init() {
            console.log('init')
            self.controlWrapper.style.display = "block";
            //Init variables and controls
            self.frames = self.inputframes? self.inputframes:{};
            self.frameTime = 1/self.framerate;
            self.enableAreaSelect(self);
            self.optionalTags.createTagControls(self.inputtagsarray);
            //Take the raw video aspect ratio
            self.aspect = self.video.offsetWidth / self.video.offsetHeight;
            //Init sliders
            self.volumeSlider.value = 0.5;
            self.seekBar.max = self.video.duration;
            self.playingCallback();
            self.overlay.width = self.video.offsetWidth;
            self.overlay.height = self.video.offsetHeight;
            //fix resize bug
            $(window).resize( function(){
                if (self.video.offsetWidth !== undefined){
                    // self.snapToAspectRatio();
                    //get transform ratio
                    var transformWidth =  self.video.offsetWidth/self.overlay.width;
                    var transformHeight = self.video.offsetHeight/self.overlay.height;
                    //resize the overlay
                    self.overlay.width = self.video.offsetWidth;
                    self.overlay.height = self.video.offsetHeight;
                    //resize the region boxes
                    self.showAllRegions();
                    //reposition selectedRegion Label
                    var selectedDiv = $('.regionCanvasSelected')[0];
                    self.positionRegionNameLabel(selectedDiv);
                }
            });
            //bind keys (note this currently overrides any listener on the parent controls needs a more elegant way to work only when control is in focus)
            window.addEventListener("keydown", (function(canMove) {
                return function(e) {
                    if (!canMove) return false;
                    canMove = false;
                    setTimeout(function() { canMove = true; }, 100);
                    switch (e.keyCode) {
                        case 37:  // left
                        self.stepBwdClicked();
                        break;
                        case 39: // right
                        self.stepFwdClicked();
                        break;
                        case 46: //delete
                        case 8:  //backspace
                        if($('.regionCanvasSelected')[0]){
                            self.deleteRegion();
                        }
                        break;
                        default: return; // exit this handler for other keys
                    }
                    e.preventDefault(); // prevent the default action (scroll / move caret)
                };
            })(true), false);
        }

        this.video.onended = ()=>{
            self.pauseState();
        };

        this.seekBar.addEventListener("mousedown", ()=> {
          self.seeking = true;
        });
    
        this.seekBar.addEventListener("mouseup", ()=> {
          self.seeking = false;
        });

        this.seekBar.addEventListener("change", ()=>{
          if (!this.imagelist){
               self.seeking = false;
               self.video.currentTime =  Math.floor(self.seekBar.value/self.frameTime) * self.frameTime;//keep the frame in sync
          }
          self.playingCallback();
        });
        
        this.volumeSlider.addEventListener("change", ()=> {
          if (!this.imagelist){
              self.video.volume = self.volumeSlider.value;
              let perc =  100 * self.volumeSlider.value / self.volumeSlider.max;
              self.volumeStyle.textContent = '.volume::-webkit-slider-runnable-track{background-size:'+ perc +'% 100%} ';
              self.volumeStyle.textContent += '.volume::-moz-range-track{background-size:'+ perc +'% 100%} ';
          }
        });
        
        this.addEventListener("playSpeedSelected", (e)=> {
          self.playback(e.detail.playbackValue, e.detail.playbackText);
        });
        
        this.addEventListener("ontagsubmitted", (e)=> {
            let arr = [];
            arr.push(e.detail.tagid);
            this.addTagsToRegion(arr);
            this.emitRegionToHost();//Persist
        });
        
        this.addEventListener("ontagdeleted", function(e) {
            let regionId = this.selectedRegionId -1;//Revert to zero-based array
            let region = this.frames[this.getCurrentFrame()][regionId];
            for(let index = 0;index < region.tags.length;index++){
                  if(region.tags[index] === e.detail.tagid){
                      region.tags.splice(index, 1);
                      break;
                  }
            }
            this.emitRegionToHost();
        });
    }

    snapToAspectRatio(){
        // -5 accounts for rounding errors during rendering to ensure
      // we never redraw larger than the parent container.
      // We need to offset for the non-scaling parts of the video controls
      this.snapWidth =
      ($('#video-tagging').parent().height() -
       $('#videoControls').innerHeight() -
       $('#videoTagControls').innerHeight() -
       5) * this.aspect;
      if(this.snapWidth > $('#video-tagging').parent().width())
        $('#video-tagging').width($('#video-tagging').parent().width());
      else
        $('#video-tagging').width(this.snapWidth);
    }

    clearArea(){
        $('canvas#overlay').imgAreaSelect({
            show:false,
            hide:true
        });
    }

    enableAreaSelect(self){
        $('canvas#overlay').imgAreaSelect({
            disable: true,
            show:false,
            hide:true
        });

        if((this.regiontype.toLowerCase() === "square") || (this.regiontype.toLowerCase() === "rectangle")) {
           $('canvas#overlay').imgAreaSelect({
                disable: false, //enable/disable
                handles: true, //grab handles when selecting the area
                aspectRatio: '1:1',
                maxWidth: self.overlay.offsetWidth,
                maxHeight: self.overlay.offsetHeight,
                minWidth:10,
                fadeSpeed: 200,
                square: (this.regiontype.toLowerCase() === "square"),
                onSelectEnd: function(img, selection){
                        if (selection.width !== 0 && selection.height !== 0) {
                        self.areaSelected = true;
                        self.createRegion(selection.x1, selection.y1, selection.x2, selection.y2);
                        self.clearArea();
                        }
                },
                onSelectStart: function(img, selection){
                    self.cleanSelectedElements();
                },
            });
        }
    } 

    updateRegionZIndices(){
        $('.regionCanvas').sort((e1, e2)=> {
            return ($(e1).width() * $(e1).height() <= $(e2).width() * $(e2).height());
        }).each((idx,e)=> {
            e.style.zIndex =(idx+200).toString();
        });
    }

    positionRegionNameLabel(div) {
        if (div){
            this.regionLabelDiv.style.left = (div.offsetLeft + parseFloat(div.style.width, 10) - parseFloat(this.regionLabelDiv.style.width, 10)) + "px";
            this.regionLabelDiv.style.top = (div.offsetTop - parseFloat(this.regionLabelDiv.style.height, 10)) + "px" ;
            //Out of bounds top - move it below div
            if(parseFloat(this.regionLabelDiv.style.top) < 0) {
                this.regionLabelDiv.style.top = (div.offsetTop + parseFloat(div.style.height, 10)) + "px" ;
            }
            this.regionLabelSpan.innerHTML = div.id;
            this.regionLabelDiv.style.display = "block";
        }
    }

    createRegion(x1,y1,x2,y2) {
        let region = this.addRegion(x1, y1, x2, y2);//Add to in-memory collection
        let xOffset = parseFloat(this.overlay.style.left);
        let yOffset = parseFloat(this.overlay.style.top);
        this.addDivToRegion(x1 + (isNaN(xOffset) ? 0 : xOffset), y1 + (isNaN(yOffset) ? 0 : yOffset), 
                            x2 + (isNaN(xOffset) ? 0 : xOffset), y2 + (isNaN(yOffset) ? 0 : yOffset), region.name); //add frame
        this.updateRegionZIndices();//update region z indecies
        this.regionSelected(region.name);//Select it by default
        //if there is only one tag enable it  by default
        if ($(`#${this.optionalTags.id}`).find('.tagButtons').size() == 1){
            $(`#${this.optionalTags.id}`).find('.tagButtons')[0].click();
        }
        if(this.lockTagsEnabled) {
            //Get all selected tags and add them to current region automatically
            //this.selectedTags was populated in this.lockTagsClicked
            let arr = [];
            for (let i=0; i<this.selectedTags.length;i++) {
              this.optionalTags.setSelected(this.selectedTags[i]);
              arr.push(this.selectedTags[i].id);
            }
            this.addTagsToRegion(arr);
            let self = this;
            //Auto step functionality - Goes to next frame automatically
            if(this.multiregions === "0") {
                setTimeout(function(){ self.stepFwdClicked(); }, 500);
            }
        }
        this.emitRegionToHost();//Persist
    }

    addTagsToRegion(selectedTagsArray) {
        let regionId = this.selectedRegionId -1;//Revert to zero-based array
        let region = this.frames[this.getCurrentFrame()][regionId];
        for (let i = 0; i < selectedTagsArray.length; i++) {
             region.tags.push(selectedTagsArray[i]);
        }
    }

    nextUntaggedClicked() {
        if (this.checkRegionLabels()){
            let frameIndex = this.getCurrentFrame();
            let lastTagIndex = parseInt(Object.keys(this.frames)[Object.keys(this.frames).length-1]) || 1 ;
            if (this.imagelist){//image handling
                if (this.imageIndex < this.imagelist.length) {
                    if (lastTagIndex <= frameIndex){
                        this.imageIndex++;
                    } else {
                        this.imageIndex = lastTagIndex;
                    }
                    this.changeImage(`url(${this.imagelist[this.imageIndex].replace(/\\/g,"/")})`);
                    this.playingCallback();
                }
            } else { //video handling
                let nextFrameOffset = Math.max((lastTagIndex - frameIndex), 1);
                if(!this.video.paused) this.pauseState();
                if ((this.video.currentTime + this.frameTime) > this.video.duration ){
                    return;
                }
                if (!this.canMove ) return; 
                //if there are no unlabled tags move to next frame
                this.video.currentTime += this.frameTime * (nextFrameOffset);
                this.playingCallback();            
            }
        }
    }
    
    lockTagsClicked(){
        let selTags = this.optionalTags.getSelectedTags();

        //There has to be selected label/s
        if (!this.lockTagsEnabled && selTags.length > 0) {
            this.lockTagsEnabled = true;
            this.selectedTags = selTags;
            if(this.multiregions === "0"){this.stepFwdClicked();}
        } else {
            this.lockTagsEnabled = false;
            this.selectedTags = [];
            this.optionalTags.resetSelected();
        }
        this.lockTag.classList.toggle("controlOn", this.lockTagsEnabled);
        this.lockTag.classList.toggle("controlOff", !this.lockTagsEnabled);
    }

    regionSelected(divId) {
        this.cleanSelectedElements();
        let div = document.getElementById(divId);
        div.classList.add("regionCanvasSelected");
        this.selectedRegionId = div.id;
        this.positionRegionNameLabel(div);
        //Tags - display the tags of the region and enable editing
        this.optionalTags.toggleEnableButtons(true);
        this.optionalTags.resetSelected();
        let regions = this.frames[this.getCurrentFrame()];
        if(regions) {
            var tags = this.frames[this.getCurrentFrame()][this.selectedRegionId - 1].tags;
            this.optionalTags.displaySelectedTags(tags);
        }
        
        function updateRegionFromDiv(div, xOffset, yOffset){
           let region = regions[(divId-1).toString()];
           region.width = parseFloat(this.overlay.width);//$('#vid').width();
           region.height = parseFloat(this.overlay.height);//$('#vid').height();
           region.x1 = parseInt(div.style.left) - ((xOffset) ? xOffset : 0);
           region.y1 = parseInt(div.style.top)  - ((yOffset) ? yOffset : 0) ;
           region.x2 = region.x1 + parseInt(div.style.width);
           region.y2 = region.y1 + parseInt(div.style.height);
        }
        
        //make region  draggable
        $('#'+divId).draggable({
            stop: (event, ui)=> {
               updateRegionFromDiv(this,parseFloat(self.overlay.style.left), parseFloat(self.overlay.style.top));
            },
            containment: $("#overlay")[0]
        });
        //make region resizable
         let self = this;
         $('#'+divId).resizable({
             stop: (event, ui)=>{
                 $('.regionCanvas').sort( (e1, e2)=> {
                   return ($(e1).width() * $(e1).height() <= $(e2).width() * $(e2).height());
                 }).each((idx,e)=> {
                   e.style.zIndex =(idx+200).toString();
                 });
             },
             containment: $("#overlay")[0],
             handles: 'all'
        });
        $('#'+divId).on('resize',(e)=>{
            updateRegionFromDiv(this,parseFloat(self.overlay.style.left), parseFloat(self.overlay.style.top));
            e.stopPropagation();
        });
        //raise regionSelectedEvent
       $('#video-tagging').trigger('canvasRegionSelected',[divId]); 
    }

    deleteRegion(e) {
        let regions = this.frames[this.getCurrentFrame()];
        let deletedRegion = regions[this.selectedRegionId - 1];
        regions.splice(this.selectedRegionId - 1, 1);
        //Shift array left to cover removed item - Rename all regions which are higher than the deleted one,
        for (let i=0;i<regions.length;i++) {
            let id = Number(regions[i].name);
            if(id > this.selectedRegionId){
                regions[i].name = id - 1;
            }
        }
        this.showAllRegions();
        this.emitRegionToHost();
    }

    clearRegions(e){
        this.frames[this.getCurrentFrame()]=[];
        this.showAllRegions();
        this.emitRegionToHost();
    }

    emitRegionToHost() {
        let frameIndex = this.getCurrentFrame();
        this.fire('onregionchanged', {frame: {frameIndex:frameIndex, regions:this.frames[frameIndex]}});
    }

    addDivToRegion(x1,y1,x2,y2,regionId) {
        let div = document.createElement("div");
        div.id = regionId;
        div.classList.add("regionCanvas");
        if(this.regiontype.toLowerCase() === "point") {
              div.style.width = this.regionsize - 1 +  "px";//Compensate for 1px border
              div.style.height = this.regionsize - 1 +  "px";
              div.style.top = y1 - this.regionsize/2  +  "px";
              div.style.left = x1 - this.regionsize/2  +  "px";
              div.classList.add("regionPoint");
        }
        if((this.regiontype.toLowerCase() === "square") || (this.regiontype.toLowerCase() === "rectangle")) {
             // add offset here
              div.style.width = x2 - x1 + "px";
              div.style.height = y2 - y1   +  "px";
              div.style.top = y1  + "px";
              div.style.left = x1 + "px";
        }
        let self = this;
        $( div )
                  .click(function(e) {
                     self.regionSelected(div.id);
                  });
        $( div )
                  .mouseenter(function(e) {
                      self.positionRegionNameLabel(this);
                  })
                  .mouseleave(function() {
                    self.regionLabelDiv.style.display = "none";
                    if(self.selectedRegionId === div.id) {
                          self.regionLabelDiv.style.display = "block";
                    }
                  });
        dom(this.$.videoWrapper).appendChild(div);
    }

    cleanSelectedElements() {
        //Remove selected style
        let regionCanvases = dom(this.root).querySelectorAll('.regionCanvas');
        for (let i=0;i<regionCanvases.length;i++) {
          regionCanvases[i].classList.remove('regionCanvasSelected');
        }
        //reset
        this.selectedRegionId = 0;
        this.optionalTags.toggleEnableButtons(false);
        this.optionalTags.resetSelected();
    }

    showAllRegions() {
        this.clearFrameElements();//Clear canvas and tags
        this.cleanSelectedElements();//Clear selected regions
        let frameIndex = this.getCurrentFrame();
        let regions = this.frames[frameIndex];
        if(regions && regions.length > 0) {
          //Draw all regions for this frame
          for (let i=0; i<regions.length;i++) {
              let region = regions[i];
              //Frame was tagged as empty?
              if (Object.keys(region).length === 0) {
                  this.indicateEmptyFrame(true);
                  continue;
              }
              //Calculate x, y relative to current width and height
              if (this.imagelist){
                 let widthRatio = this.overlay.width / region.width;
                 let heightRatio = this.overlay.height / region.height ;
              } else {
                 let widthRatio = $("#vid").width() / region.width;
                 let heightRatio = $("#vid").height() / region.height ;
              }
              let x1 = (region.x1 * widthRatio);
              let y1 = (region.y1 * heightRatio);
              let x2 = (region.x2 * widthRatio);
              let y2 = (region.y2 * heightRatio);
              x1 = (region.x1 * widthRatio);
              y1 = (region.y1 * heightRatio);
              x2 = (region.x2 * widthRatio);
              y2 = (region.y2 * heightRatio);
              let xOffset = parseFloat(this.overlay.style.left);
              let yOffset = parseFloat(this.overlay.style.top);
              this.addDivToRegion(x1 + (isNaN(xOffset) ? 0 : xOffset), y1 + (isNaN(yOffset) ? 0 : yOffset), 
                                  x2 + (isNaN(xOffset) ? 0 : xOffset), y2 + (isNaN(yOffset) ? 0 : yOffset), region.name); //add frame
              //Only 1 region - select it and show tags
              if (regions.length === 1) {
                  this.regionSelected(region.name);
              }
              this.updateRegionZIndices();
          }
        }
    }

    addRegion(x1,y1,x2,y2) {
        this.resetEmptyFrame();//Clear empty frame logic
        let region = {};
        region.x1 = x1;
        region.y1 = y1;
        region.x2 = x2;
        region.y2 = y2;
        region.id = this.uniqueTagId++;
        region.width = parseFloat(this.overlay.width); //ensures pass by value
        region.height = $('#vid').height();
        region.type = this.regiontype;
        region.tags = [];
        let frameIndex = this.getCurrentFrame();
        let regions = this.frames[frameIndex];
        //The array is populated and can contain multiple regions
        if(this.multiregions == 1 && regions) {
            region.name = regions.length + 1;
            this.frames[frameIndex].push(region);
        }
        else {//Only one region allowed
            this.clearFrameElements();
            region.name = 1;
            this.frames[frameIndex] = [];
            this.frames[frameIndex].push(region);
        }
        return region;
    }

    clearFrameElements() {
        //Clear divs
        $(this.videoWrapper).children(".regionCanvas").remove();
        //reset tag buttons to not selected
        this.optionalTags.resetSelected();
        //hide region number
        this.regionLabelDiv.style.display = "none";
        //Clears the empty frame icon
        this.indicateEmptyFrame(false);
    }

    getCurrentFrame() {
        if (this.imagelist){
          return this.imageIndex;
        } 
        return this.video.currentTime === 0 ? 1 : Math.ceil((this.video.currentTime - this.videoStartTime) * this.framerate) + 1 ;
    }

    indicateEmptyFrame(selected) {
        if(selected) {
            this.emptyFrame.classList.remove("controlOff");
            this.emptyFrame.classList.add("controlOn");
        }
        else {
            this.emptyFrame.classList.remove("controlOn");
            this.emptyFrame.classList.add("controlOff");
        }
    }

    emptyFrameClicked() {
        let frameIndex = this.getCurrentFrame();
        let regions = this.frames[frameIndex];
        if(!regions || regions.length === 0) {
            this.frames[frameIndex] = [{}];
            this.indicateEmptyFrame(true);
            this.emitRegionToHost();
            if(this.lockTagsEnabled){
                this.stepFwdClicked();
            }
        }
    }
  
    resetEmptyFrame() {
        let regions = this.frames[this.getCurrentFrame()];
        //If there is an empty region
        if(regions && regions.length === 1 && Object.keys(regions[0]).length === 0) {
            //reset all for this frame
            this.frames[this.getCurrentFrame()] = [];
            this.clearFrameElements();
        }
    }

    muteClicked() {
        this.mute.classList.toggle("icon-volume-mute2", !this.video.muted);
        this.mute.classList.toggle("icon-volume-medium", this.video.muted);
        this.video.muted = !this.video.muted;
    }

    playback(val,text) {
        if(val !== null){
            this.video.playbackRate = val;
            this.playbackSpan.innerHTML = text;
        }
        this.playSpeedControl.style.display = "none";
    }

    /**
     * Shows the play speed control
     */
    playbackSpeedClicked() {
        let offset = $('#playSpeedCell').offset();
        let top = offset.top - $('#playSpeedControl').height();
        let left = offset.left + $('#playSpeedCell').width() / 4;
        $('#playSpeedControl').css({'left': left, 'top': top});
        this.playSpeedControl.style.display = this.playSpeedControl.style.display === "block"?"none":"block";
    }

    playPauseClicked() {
        this.video.paused ? this.playState():this.pauseState();
    }

    getUnlabeledRegionTags(regionId){
        let regions = this.frames[regionId];
        let unlabledTags = [];
        if (regions !== undefined){
            unlabledTags = regions.map(function(region,index){
                if (!region.tags.length > 0) return index + 1;
        }).filter(Number.isInteger);
        }
        return unlabledTags;
    }

    checkRegionLabels(){
      let unlabledTags = this.getUnlabeledRegionTags(this.getCurrentFrame());
      if (unlabledTags.length > 0){
          alert(`Cannot move to the next frame until all tags are labeled. Please label the following tags [${unlabledTags}] on the displayed frame.`);
          return false;
      }
      return true;
    }

    initImageDir() {
        if (!this.imagelist) return;
        //$("#rotate").show();
        this.changeImage(`url(${this.imagelist[this.imageIndex].replace(/\\/g,"/")})`);
        let self = this;
        self.frames = self.inputframes? self.inputframes:{};
        self.optionalTags.createTagControls(self.inputtagsarray);
  
        //bind keys (note this currently overrides any listener on the parent controls needs a more elegant way to work only when control is in focus)
        window.addEventListener("keydown", (function(canMove) {
            return function(e) {
                if (!canMove) return false;
                canMove = false;
                setTimeout(function() { canMove = true; }, 100);
                switch (e.keyCode) {
                    case 37:  // left
                    self.stepBwdClicked();
                    break;
                    case 39: // right
                    self.stepFwdClicked();
                    break;
                    case 46: //delete
                    case 8:  //backspace
                    if($('.regionCanvasSelected')[0]){
                        self.deleteRegion();
                    }
                    break;
                    default: return; // exit this handler for other keys
                }
                e.preventDefault(); // prevent the default action (scroll / move caret)
            };
        })(true), false);        
    }

    changeImage(imageUrl){
        this.rotation = 0;
        this.video.style.backgroundImage = encodeURI(imageUrl);
        this.curImg.src = `${this.imagelist[this.imageIndex]}`;
        let self = this;
        self.curImg.onload = function() {
            self.controlWrapper.style.display = "block";
            let imgRatio = self.curImg.width / self.curImg.height;
            //Size canvas as image
            let scaleByPortrait = ((self.video.offsetWidth/self.video.offsetHeight) >= (self.curImg.width/self.curImg.height));
            //todo clean this logic
            if (scaleByPortrait){
               self.overlay.width = parseFloat(self.video.offsetHeight * imgRatio);
               self.overlay.style.left  =  `${((self.video.offsetWidth/2) - (self.overlay.width/2))}px`;
               self.overlay.style.top  = '0px';
               self.overlay.height = self.video.offsetHeight;
            } else {
               self.overlay.height =  (self.video.offsetWidth / imgRatio);
               self.overlay.style.top  =  `${((self.video.offsetHeight/2) - (self.overlay.height/2))}px`;
               self.overlay.style.left  = '0px';
               self.overlay.width = self.video.offsetWidth;
            }
            //Init variables and controls
            self.enableAreaSelect(self);
            self.playingCallback();
            //fix resize bug
            $(window).off("resize");
            $(window).resize(function(){
                if (self.video.offsetWidth !== undefined){
                    //Todo clean this
                    if (scaleByPortrait){
                        //get transform ratio
                        let onScreenWidth =   parseFloat(self.video.offsetHeight * imgRatio);
                        let transformWidth =  parseFloat(onScreenWidth) / parseFloat(self.overlay.width);
                        let transformHeight = parseFloat(self.video.offsetHeight)/parseFloat(self.overlay.height);
                        //resize the overlay
                        self.overlay.width =  parseFloat(self.video.offsetHeight * imgRatio);
                        self.overlay.style.left = `${((self.video.offsetWidth/2) - (self.overlay.width/2))}px`;
                        self.overlay.height = self.video.offsetHeight;
                    } else {
                        //get transform ratio
                        let onScreenHeight =  parseFloat(self.video.offsetWidth / imgRatio);
                        let transformWidth =  parseFloat(self.video.offsetWidth)/parseFloat(self.overlay.width);
                        let transformHeight = parseFloat(onScreenHeight) / parseFloat(self.overlay.height);
                        //resize the overlay
                        self.overlay.height =  parseFloat(self.video.offsetWidth / imgRatio);
                        self.overlay.style.top = `${((self.video.offsetHeight/2) - (self.overlay.height/2))}px`;
                        self.overlay.width = self.video.offsetWidth;
                    }
  
                    //resize the region boxes
                    self.showAllRegions();
                    //reposition selectedRegion Label
                    var selectedDiv = $('.regionCanvasSelected')[0];
                    self.positionRegionNameLabel(selectedDiv);
                }
            });
        }
    }

    disableImageDir() {       
        $("#rotate").hide(); 
        $(window).off("resize");
        this.imageIndex = 0;
        this.imagelist = undefined;
        this.video.removeAttribute("poster");
        this.src = "";
    }
  
    rotate() {
        this.rotation = (this.rotation + 90) % 360;
        $('#vid').css("transform",`rotate(${this.rotation}deg)`);   
    }

    stepFwdClicked(fireEvents) {   
        if (!fireEvents) fireEvents=true;   
        if (this.checkRegionLabels()){
            //raise before next frame  
            if (this.imagelist){//image handling
                if(fireEvents)$('#video-tagging').trigger('stepFwdClicked-BeforeStep');    
                if (this.imageIndex < this.imagelist.length-1) {
                    this.imageIndex++;
                    this.changeImage(`url(${this.imagelist[this.imageIndex].replace(/\\/g,"/")})`);
                    this.playingCallback();
                }
            } else { //video handling
                if(!this.video.paused) this.pauseState();
                if ((this.video.currentTime + this.frameTime) > this.video.duration ){
                    //this.video.currentTime = this.video.duration;
                    return;
                }
                if (!this.canMove ) return; 
                if(fireEvents)$('#video-tagging').trigger('stepFwdClicked-BeforeStep');    
                //if there are no unlabled tags move to next frame
                this.video.currentTime += this.frameTime;
                this.playingCallback();            
            } 
            //raise after next frame
            if(fireEvents)$('#video-tagging').trigger('stepFwdClicked-AfterStep');
        }
    }
  
    stepBwdClicked() {
        if (!this.canMove) return;    
        if (this.imagelist){//image handling
            if (this.imageIndex > 0) {
                this.imageIndex--;
                this.changeImage(`url(${this.imagelist[this.imageIndex].replace(/\\/g,"/")})`);
                this.playingCallback();
            }
        } 
        if (this.video.currentTime > 0) {
            if(!this.video.paused) {
              this.pauseState();
            }
            if (this.checkRegionLabels()){
              this.video.currentTime -= this.frameTime;
              this.playingCallback();
            }
        }
    }
  
    videoSrcChanged(newValue, oldValue) {
        if(this.video){
            if (this.imagelist){
                this.initImageDir();
            } else{
                this.video.src = newValue;
                this.video.style.backgroundImage = null;
            }
        }
    }
  
    videoClicked(e) {
        this.cleanSelectedElements();
        if(!((this.regiontype.toLowerCase() === "square") || (this.regiontype.toLowerCase() === "rectangle")))
        {
            let rect = this.overlay.getBoundingClientRect();
            let x1 = (e.clientX-rect.left)/(rect.right-rect.left)*this.overlay.width;
            let y1 = (e.clientY-rect.top)/(rect.bottom-rect.top)*this.overlay.height;
            this.createRegion(x1, y1, null, null);
        }
    }
  
    playState() {
        this.video.play();
        this.playButton.classList.toggle("icon-pause2", !this.video.paused);
        //Reset lock tags to off
        this.lockTagsEnabled = true;
        this.lockTagsClicked();
        this.optionalTags.toggleEnableButtons(false);
        $('canvas#overlay').imgAreaSelect({disable: true});//disable canvas
        let self = this;
        this.playing = setInterval(function() {
            self.playingCallback();
        }, 10);
    }
  
    pauseState() {
        this.video.pause();
        clearInterval(this.playing);
        this.video.currentTime =  Math.floor(this.video.currentTime/this.frameTime) * this.frameTime;//keep the frame in sync
        this.playingCallback();
        this.playButton.classList.toggle("icon-pause2", !this.video.paused);
        this.optionalTags.toggleEnableButtons(false);
        $('canvas#overlay').imgAreaSelect({disable: false});//enable canvas
    }
  
    playingCallback() {
        if (!this.imagelist){
            this.frameText.innerHTML = this.getCurrentFrame();
            this.displayVideoTime();
            if(!this.seeking){
                this.updateSeekBar();
            }
        } else{
            this.frameText.innerHTML = `${this.getCurrentFrame() + 1}/${this.imagelist.length}`;
        }
  
        this.showAllRegions();
    }
  
    displayVideoTime() {
        let currentTime = Math.round(this.video.currentTime);
        let remainingtTime = Math.round(this.video.duration - this.video.currentTime);
        //Format using moment.js
        currentTime = moment().startOf('day').seconds(currentTime).format('HH:mm:ss');
        remainingtTime = moment().startOf('day').seconds(remainingtTime).format('HH:mm:ss');
        this.timeSpan.innerHTML = currentTime + "  /  " + remainingtTime;
    }
  
    updateSeekBar() {
        this.seekBar.value = this.video.currentTime;
        let perc =  100 * this.seekBar.value / this.seekBar.max;
        this.seekStyle.textContent =  '.seek::-webkit-slider-runnable-track{background-size:'+perc+'% 100%}';
        this.seekStyle.textContent += '.seek::-moz-range-track{background-size:'+perc+'% 100%}';
    }
}

window.customElements.define('video-tagging', VideoTagging);

/*
 * imgAreaSelect jQuery plugin
 * version 0.9.10
 *
 * Copyright (c) 2008-2013 Michal Wojciechowski (odyniec.net)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://odyniec.net/projects/imgareaselect/
 *
 * Modified by Ari Bornstein to add support for non fixAspectRatio scenarios
 * 
 */

(function($) {

var abs = Math.abs,
    max = Math.max,
    min = Math.min,
    round = Math.round;

function div() {
    return $('<div/>');
}

$.imgAreaSelect = (img, options) =>{
    var

        $img = $(img),

        imgLoaded,

        $box = div(),
        $area = div(),
        $border = div().add(div()).add(div()).add(div()),
        $outer = div().add(div()).add(div()).add(div()),
        $handles = $([]),

        $areaOpera,

        left, top,

        imgOfs = { left: 0, top: 0 },

        imgWidth, imgHeight,

        $parent,

        parOfs = { left: 0, top: 0 },

        zIndex = 0,

        position = 'absolute',

        startX, startY,

        scaleX, scaleY,

        resize,

        minWidth, minHeight, maxWidth, maxHeight,

        aspectRatio,

        shown,

        x1, y1, x2, y2,

        selection = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },

        docElem = document.documentElement,

        ua = navigator.userAgent,

        $p, d, i, o, w, h, adjusted;

    function viewX(x) {
        return x + imgOfs.left - parOfs.left;
    }

    function viewY(y) {
        return y + imgOfs.top - parOfs.top;
    }

    function selX(x) {
        return x - imgOfs.left + parOfs.left;
    }

    function selY(y) {
        return y - imgOfs.top + parOfs.top;
    }

    function evX(event) {
        return event.pageX - parOfs.left;
    }

    function evY(event) {
        return event.pageY - parOfs.top;
    }

    function getSelection(noScale) {
        var sx = noScale || scaleX, sy = noScale || scaleY;

        return { x1: round(selection.x1 * sx),
            y1: round(selection.y1 * sy),
            x2: round(selection.x2 * sx),
            y2: round(selection.y2 * sy),
            width: round(selection.x2 * sx) - round(selection.x1 * sx),
            height: round(selection.y2 * sy) - round(selection.y1 * sy) };
    }

    function setSelection(x1, y1, x2, y2, noScale) {
        var sx = noScale || scaleX, sy = noScale || scaleY;

        selection = {
            x1: round(x1 / sx || 0),
            y1: round(y1 / sy || 0),
            x2: round(x2 / sx || 0),
            y2: round(y2 / sy || 0)
        };

        selection.width = selection.x2 - selection.x1;
        selection.height = selection.y2 - selection.y1;
    }

    function adjust() {
        if (!imgLoaded || !$img.width())
            return;

        imgOfs = { left: round($img.offset().left), top: round($img.offset().top) };

        imgWidth = $img.innerWidth();
        imgHeight = $img.innerHeight();

        imgOfs.top += ($img.outerHeight() - imgHeight) >> 1;
        imgOfs.left += ($img.outerWidth() - imgWidth) >> 1;

        minWidth = round(options.minWidth / scaleX) || 0;
        minHeight = round(options.minHeight / scaleY) || 0;
        maxWidth = round(min(options.maxWidth / scaleX || 1<<24, imgWidth));
        maxHeight = round(min(options.maxHeight / scaleY || 1<<24, imgHeight));

        if ($().jquery == '1.3.2' && position == 'fixed' &&
            !docElem['getBoundingClientRect'])
        {
            imgOfs.top += max(document.body.scrollTop, docElem.scrollTop);
            imgOfs.left += max(document.body.scrollLeft, docElem.scrollLeft);
        }

        parOfs = /absolute|relative/.test($parent.css('position')) ?
            { left: round($parent.offset().left) - $parent.scrollLeft(),
                top: round($parent.offset().top) - $parent.scrollTop() } :
            position == 'fixed' ?
                { left: $(document).scrollLeft(), top: $(document).scrollTop() } :
                { left: 0, top: 0 };

        left = viewX(0);
        top = viewY(0);

        if (selection.x2 > imgWidth || selection.y2 > imgHeight)
            doResize();
    }

    function update(resetKeyPress) {
        if (!shown) return;

        $box.css({ left: viewX(selection.x1), top: viewY(selection.y1) })
            .add($area).width(w = selection.width).height(h = selection.height);

        $area.add($border).add($handles).css({ left: 0, top: 0 });

        $border
            .width(max(w - $border.outerWidth() + $border.innerWidth(), 0))
            .height(max(h - $border.outerHeight() + $border.innerHeight(), 0));

        $($outer[0]).css({ left: left, top: top,
            width: selection.x1, height: imgHeight });
        $($outer[1]).css({ left: left + selection.x1, top: top,
            width: w, height: selection.y1 });
        $($outer[2]).css({ left: left + selection.x2, top: top,
            width: imgWidth - selection.x2, height: imgHeight });
        $($outer[3]).css({ left: left + selection.x1, top: top + selection.y2,
            width: w, height: imgHeight - selection.y2 });

        w -= $handles.outerWidth();
        h -= $handles.outerHeight();

        switch ($handles.length) {
        case 8:
            $($handles[4]).css({ left: w >> 1 });
            $($handles[5]).css({ left: w, top: h >> 1 });
            $($handles[6]).css({ left: w >> 1, top: h });
            $($handles[7]).css({ top: h >> 1 });
        case 4:
            $handles.slice(1,3).css({ left: w });
            $handles.slice(2,4).css({ top: h });
        }

        if (resetKeyPress !== false) {
            if ($.imgAreaSelect.onKeyPress != docKeyPress)
                $(document).unbind($.imgAreaSelect.keyPress,
                    $.imgAreaSelect.onKeyPress);

            if (options.keys)
                $(document)[$.imgAreaSelect.keyPress](
                    $.imgAreaSelect.onKeyPress = docKeyPress);
        }

        if (msie && $border.outerWidth() - $border.innerWidth() == 2) {
            $border.css('margin', 0);
            setTimeout(function () { $border.css('margin', 'auto'); }, 0);
        }
    }

    function doUpdate(resetKeyPress) {
        adjust();
        update(resetKeyPress);
        x1 = viewX(selection.x1); y1 = viewY(selection.y1);
        x2 = viewX(selection.x2); y2 = viewY(selection.y2);
    }

    function hide($elem, fn) {
        options.fadeSpeed ? $elem.fadeOut(options.fadeSpeed, fn) : $elem.hide();

    }

    function areaMouseMove(event) {
        var x = selX(evX(event)) - selection.x1,
            y = selY(evY(event)) - selection.y1;

        if (!adjusted) {
            adjust();
            adjusted = true;

            $box.one('mouseout', function () { adjusted = false; });
        }

        resize = '';

        if (options.resizable) {
            if (y <= options.resizeMargin)
                resize = 'n';
            else if (y >= selection.height - options.resizeMargin)
                resize = 's';
            if (x <= options.resizeMargin)
                resize += 'w';
            else if (x >= selection.width - options.resizeMargin)
                resize += 'e';
        }

        $box.css('cursor', resize ? resize + '-resize' :
            options.movable ? 'move' : '');
        if ($areaOpera)
            $areaOpera.toggle();
    }

    function docMouseUp(event) {
        $('body').css('cursor', '');
        if (options.autoHide || selection.width * selection.height == 0)
            hide($box.add($outer), function () { $(this).hide(); });

        $(document).unbind('mousemove', selectingMouseMove);
        $box.mousemove(areaMouseMove);

        options.onSelectEnd(img, getSelection());
    }

    function areaMouseDown(event) {
        if (event.which != 1) return false;

        adjust();

        if (resize) {
            $('body').css('cursor', resize + '-resize');

            x1 = viewX(selection[/w/.test(resize) ? 'x2' : 'x1']);
            y1 = viewY(selection[/n/.test(resize) ? 'y2' : 'y1']);

            $(document).mousemove(selectingMouseMove)
                .one('mouseup', docMouseUp);
            $box.unbind('mousemove', areaMouseMove);
        }
        else if (options.movable) {
            startX = left + selection.x1 - evX(event);
            startY = top + selection.y1 - evY(event);

            $box.unbind('mousemove', areaMouseMove);

            $(document).mousemove(movingMouseMove)
                .one('mouseup', function () {
                    options.onSelectEnd(img, getSelection());

                    $(document).unbind('mousemove', movingMouseMove);
                    $box.mousemove(areaMouseMove);
                });
        }
        else
            $img.mousedown(event);

        return false;
    }

    function fixAspectRatio(xFirst) {
        if (aspectRatio)
            if (xFirst) {
                x2 = max(left, min(left + imgWidth,
                    x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1)));

                y2 = round(max(top, min(top + imgHeight,
                    y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1))));
                x2 = round(x2);
            }
            else {
                y2 = max(top, min(top + imgHeight,
                    y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1)));
                x2 = round(max(left, min(left + imgWidth,
                    x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1))));
                y2 = round(y2);
            }
    }

    function doResize() {
        x1 = min(x1, left + imgWidth);
        y1 = min(y1, top + imgHeight);

        if (abs(x2 - x1) < minWidth) {
            x2 = x1 - minWidth * (x2 < x1 || -1);

            if (x2 < left)
                x1 = left + minWidth;
            else if (x2 > left + imgWidth)
                x1 = left + imgWidth - minWidth;
        }

        if (abs(y2 - y1) < minHeight) {
            y2 = y1 - minHeight * (y2 < y1 || -1);

            if (y2 < top)
                y1 = top + minHeight;
            else if (y2 > top + imgHeight)
                y1 = top + imgHeight - minHeight;
        }

        x2 = max(left, min(x2, left + imgWidth));
        y2 = max(top, min(y2, top + imgHeight));

        if (options.square)
        {
            fixAspectRatio(abs(x2 - x1) < abs(y2 - y1) * aspectRatio);

            if (abs(x2 - x1) > maxWidth) {
                x2 = x1 - maxWidth * (x2 < x1 || -1);
                fixAspectRatio();
            }

            if (abs(y2 - y1) > maxHeight) {
                y2 = y1 - maxHeight * (y2 < y1 || -1);
                fixAspectRatio(true);
            }
        }

        selection = { x1: selX(min(x1, x2)), x2: selX(max(x1, x2)),
            y1: selY(min(y1, y2)), y2: selY(max(y1, y2)),
            width: abs(x2 - x1), height: abs(y2 - y1) };

        update();

        options.onSelectChange(img, getSelection());
    }

    function selectingMouseMove(event) {
        x2 = /w|e|^$/.test(resize) || aspectRatio ? evX(event) : viewX(selection.x2);
        y2 = /n|s|^$/.test(resize) || aspectRatio ? evY(event) : viewY(selection.y2);

        doResize();

        return false;

    }

    function doMove(newX1, newY1) {
        x2 = (x1 = newX1) + selection.width;
        y2 = (y1 = newY1) + selection.height;

        $.extend(selection, { x1: selX(x1), y1: selY(y1), x2: selX(x2),
            y2: selY(y2) });

        update();

        options.onSelectChange(img, getSelection());
    }

    function movingMouseMove(event) {
        x1 = max(left, min(startX + evX(event), left + imgWidth - selection.width));
        y1 = max(top, min(startY + evY(event), top + imgHeight - selection.height));

        doMove(x1, y1);

        event.preventDefault();

        return false;
    }

    function startSelection() {
        $(document).unbind('mousemove', startSelection);
        adjust();

        x2 = x1;
        y2 = y1;

        doResize();

        resize = '';

        if (!$outer.is(':visible'))
            $box.add($outer).hide().fadeIn(options.fadeSpeed||0);

        shown = true;

        $(document).unbind('mouseup', cancelSelection)
            .mousemove(selectingMouseMove).one('mouseup', docMouseUp);
        $box.unbind('mousemove', areaMouseMove);

        options.onSelectStart(img, getSelection());
    }

    function cancelSelection() {
        $(document).unbind('mousemove', startSelection)
            .unbind('mouseup', cancelSelection);
        hide($box.add($outer));

        setSelection(selX(x1), selY(y1), selX(x1), selY(y1));

        if (!(this instanceof $.imgAreaSelect)) {
            options.onSelectChange(img, getSelection());
            options.onSelectEnd(img, getSelection());
        }
    }

    function imgMouseDown(event) {
        if (event.which != 1 || $outer.is(':animated')) return false;

        adjust();
        startX = x1 = evX(event);
        startY = y1 = evY(event);

        $(document).mousemove(startSelection).mouseup(cancelSelection);

        return false;
    }

    function windowResize() {
        doUpdate(false);
    }

    function imgLoad() {
        imgLoaded = true;

        setOptions(options = $.extend({
            classPrefix: 'imgareaselect',
            movable: true,
            parent: 'body',
            resizable: true,
            resizeMargin: 10,
            onInit: function () {},
            onSelectStart: function () {},
            onSelectChange: function () {},
            onSelectEnd: function () {}
        }, options));

        $box.add($outer).css({ visibility: '' });

        if (options.show) {
            shown = true;
            adjust();
            update();
            $box.add($outer).hide().fadeIn(options.fadeSpeed||0);
        }

        setTimeout(function () { options.onInit(img, getSelection()); }, 0);
    }

    var docKeyPress = function(event) {
        var k = options.keys, d, t, key = event.keyCode;

        d = !isNaN(k.alt) && (event.altKey || event.originalEvent.altKey) ? k.alt :
            !isNaN(k.ctrl) && event.ctrlKey ? k.ctrl :
            !isNaN(k.shift) && event.shiftKey ? k.shift :
            !isNaN(k.arrows) ? k.arrows : 10;

        if (k.arrows == 'resize' || (k.shift == 'resize' && event.shiftKey) ||
            (k.ctrl == 'resize' && event.ctrlKey) ||
            (k.alt == 'resize' && (event.altKey || event.originalEvent.altKey)))
        {
            switch (key) {
            case 37:
                d = -d;
            case 39:
                t = max(x1, x2);
                x1 = min(x1, x2);
                x2 = max(t + d, x1);
                if (options.square) fixAspectRatio();
                break;
            case 38:
                d = -d;
            case 40:
                t = max(y1, y2);
                y1 = min(y1, y2);
                y2 = max(t + d, y1);
                if (options.square) fixAspectRatio(true);
                break;
            default:
                return;
            }

            doResize();
        }
        else {
            x1 = min(x1, x2);
            y1 = min(y1, y2);

            switch (key) {
            case 37:
                doMove(max(x1 - d, left), y1);
                break;
            case 38:
                doMove(x1, max(y1 - d, top));
                break;
            case 39:
                doMove(x1 + min(d, imgWidth - selX(x2)), y1);
                break;
            case 40:
                doMove(x1, y1 + min(d, imgHeight - selY(y2)));
                break;
            default:
                return;
            }
        }

        return false;
    };

    function styleOptions($elem, props) {
        for (var option in props)
            if (options[option] !== undefined)
                $elem.css(props[option], options[option]);
    }

    function setOptions(newOptions) {
        if (newOptions.parent)
            ($parent = $(newOptions.parent)).append($box.add($outer));

        $.extend(options, newOptions);

        adjust();

        if (newOptions.handles != null) {
            $handles.remove();
            $handles = $([]);

            i = newOptions.handles ? newOptions.handles == 'corners' ? 4 : 8 : 0;

            while (i--)
                $handles = $handles.add(div());

            $handles.addClass(options.classPrefix + '-handle').css({
                position: 'absolute',
                fontSize: 0,
                zIndex: zIndex + 1 || 1
            });

            if (!parseInt($handles.css('width')) >= 0)
                $handles.width(5).height(5);

            if (o = options.borderWidth)
                $handles.css({ borderWidth: o, borderStyle: 'solid' });

            styleOptions($handles, { borderColor1: 'border-color',
                borderColor2: 'background-color',
                borderOpacity: 'opacity' });
        }

        scaleX = options.imageWidth / imgWidth || 1;
        scaleY = options.imageHeight / imgHeight || 1;

        if (newOptions.x1 != null) {
            setSelection(newOptions.x1, newOptions.y1, newOptions.x2,
                newOptions.y2);
            newOptions.show = !newOptions.hide;
        }

        if (newOptions.keys)
            options.keys = $.extend({ shift: 1, ctrl: 'resize' },
                newOptions.keys);

        $outer.addClass(options.classPrefix + '-outer');
        $area.addClass(options.classPrefix + '-selection');
        for (i = 0; i++ < 4;)
            $($border[i-1]).addClass(options.classPrefix + '-border' + i);

        styleOptions($area, { selectionColor: 'background-color',
            selectionOpacity: 'opacity' });
        styleOptions($border, { borderOpacity: 'opacity',
            borderWidth: 'border-width' });
        styleOptions($outer, { outerColor: 'background-color',
            outerOpacity: 'opacity' });
        if (o = options.borderColor1)
            $($border[0]).css({ borderStyle: 'solid', borderColor: o });
        if (o = options.borderColor2)
            $($border[1]).css({ borderStyle: 'dashed', borderColor: o });

        $box.append($area.add($border).add($areaOpera)).append($handles);

        if (msie) {
            if (o = ($outer.css('filter')||'').match(/opacity=(\d+)/))
                $outer.css('opacity', o[1]/100);
            if (o = ($border.css('filter')||'').match(/opacity=(\d+)/))
                $border.css('opacity', o[1]/100);
        }

        if (newOptions.hide)
            hide($box.add($outer));
        else if (newOptions.show && imgLoaded) {
            shown = true;
            $box.add($outer).fadeIn(options.fadeSpeed||0);
            doUpdate();
        }

        aspectRatio = (d = (options.aspectRatio || '').split(/:/))[0] / d[1];

        $img.add($outer).unbind('mousedown', imgMouseDown);

        if (options.disable || options.enable === false) {
            $box.unbind('mousemove', areaMouseMove).unbind('mousedown', areaMouseDown);
            $(window).unbind('resize', windowResize);
        }
        else {
            if (options.enable || options.disable === false) {
                if (options.resizable || options.movable)
                    $box.mousemove(areaMouseMove).mousedown(areaMouseDown);

                $(window).resize(windowResize);
            }

            if (!options.persistent)
                $img.add($outer).mousedown(imgMouseDown);
        }

        options.enable = options.disable = undefined;
    }

    this.remove = function () {
        setOptions({ disable: true });
        $box.add($outer).remove();
    };

    this.getOptions = function () { return options; };

    this.setOptions = setOptions;

    this.getSelection = getSelection;

    this.setSelection = setSelection;

    this.cancelSelection = cancelSelection;

    this.update = doUpdate;

    var msie = (/msie ([\w.]+)/i.exec(ua)||[])[1],
        opera = /opera/i.test(ua),
        safari = /webkit/i.test(ua) && !/chrome/i.test(ua);

    $p = $img;

    while ($p.length) {
        zIndex = max(zIndex,
            !isNaN($p.css('z-index')) ? $p.css('z-index') : zIndex);
        if ($p.css('position') == 'fixed')
            position = 'fixed';

        $p = $p.parent(':not(body)');
    }

    zIndex = options.zIndex || zIndex;

    if (msie)
        $img.attr('unselectable', 'on');

    $.imgAreaSelect.keyPress = msie || safari ? 'keydown' : 'keypress';

    if (opera)

        $areaOpera = div().css({ width: '100%', height: '100%',
            position: 'absolute', zIndex: zIndex + 2 || 2 });

    $box.add($outer).css({ visibility: 'hidden', position: position,
        overflow: 'hidden', zIndex: zIndex || '0' });
    $box.css({ zIndex: zIndex + 2 || 2 });
    $area.add($border).css({ position: 'absolute', fontSize: 0 });

    img.complete || img.readyState == 'complete' || !$img.is('img') ?
        imgLoad() : $img.one('load', imgLoad);

    if (!imgLoaded && msie && msie >= 7)
        img.src = img.src;
};

$.fn.imgAreaSelect = function (options) {
    options = options || {};

    this.each(function () {
        if ($(this).data('imgAreaSelect')) {
            if (options.remove) {
                $(this).data('imgAreaSelect').remove();
                $(this).removeData('imgAreaSelect');
            }
            else
                $(this).data('imgAreaSelect').setOptions(options);
        }
        else if (!options.remove) {
            if (options.enable === undefined && options.disable === undefined)
                options.enable = true;

            $(this).data('imgAreaSelect', new $.imgAreaSelect(this, options));
        }
    });

    if (options.instance)
        return $(this).data('imgAreaSelect');

    return this;
};

})(jQuery);
