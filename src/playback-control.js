/*
   playback-control control for play speed of video
       of the video-tagging control
*/
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import './video-taggingstyles.js';

class PlaybackControl extends PolymerElement {
  static get template() {
    return html`
      <style include="video-taggingstyles"></style>
      <div id="container" on-mouseleave="containerMouseOut">
        <div id="speed1" class="playSpeedValues clickableControl" on-click="playbackClicked">x 1.0  </div>
        <div id="speed2" class="playSpeedValues clickableControl" on-click="playbackClicked">x .50</div>
        <div id="speed3" class="playSpeedValues clickableControl" on-click="playbackClicked">x .25</div>
        <div id="speed4" class="playSpeedValues clickableControl" on-click="playbackClicked">x .10</div>
        <div id="speed5" class="playSpeedValues clickableControl" on-click="playbackClicked">x .05</div>
      </div>
    `;
  }

  attached(){
    this.container = this.$$('#container');
    this.speed1 = this.$$('#speed1');
    this.speed1.value = 1;
    this.speed2 = this.$$('#speed2');
    this.speed2.value = .5;
    this.speed3 = this.$$('#speed3');
    this.speed3.value = .25;
    this.speed4 = this.$$('#speed4');
    this.speed4.value = .1;
    this.speed5 = this.$$('#speed5');
    this.speed5.value = .05;
  }

  playbackClicked(e){
    //Reset
    let playSpeeds = this.container.children;
    for (let i=0;i<playSpeeds.length;i++) {
      playSpeeds[i].classList.remove('playSpeedValueSelected');
    };
    //Highlight selected
    let div = this.$$('#' + e.target.id);
    div.classList.add('playSpeedValueSelected');
    this.fire("playSpeedSelected",{playbackValue:div.value, playbackText:div.innerHTML});
  }

  containerMouseOut(e){
    this.fire("playSpeedSelected",{playbackValue:null}); 
  }
}

window.customElements.define('playback-control', PlaybackControl);