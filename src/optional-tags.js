/*
   optional-tags control for tag functionality
       of the video-tagging control
*/
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { dom } from '@polymer/polymer/lib/legacy/polymer.dom'
import './video-taggingstyles.js';

class OptionalTags extends PolymerElement {
  static get template() {
    return html`
      <style include="video-taggingstyles"></style>
      <div id="tagsContainer">
         <div id="buttonsContainer"></div>
      </div>
    `;
  }

  attached(){
    this.tagsContainer = this.$$('#tagsContainer');
    this.buttonsContainer = this.$$('#buttonsContainer');
  }

  createTagControls(tagsArray){
    $('#buttonsContainer').empty();
     for(let index = 0;index < tagsArray.length;index++){
           let btn = document.createElement("input");
           btn.id = tagsArray[index];
           btn.type = "button";
           btn.className = "tagButtons clickableControl";
           btn.onclick = this.submitTextClicked;
           btn.disabled = 'disabled';
           let self = this;
           btn.addEventListener("click", (e)=> {
             if($(e.target).hasClass('tagOn')){
                 self.setUnselected(e.target);
                 self.fire('ontagdeleted', {tagid:e.target.id});
             }
             else {
                 self.setSelected(e.target);
                 self.fire('ontagsubmitted', {tagid:e.target.id});
             }
           });
           btn.value = tagsArray[index];
           dom(this.$.buttonsContainer).appendChild(btn);  
    }
  }

  displaySelectedTags(tagsArray){
    if(tagsArray && tagsArray !== null){
      for(let index=0;index<tagsArray.length;index++){
          for (let i=0;i<this.buttonsContainer.childNodes.length;i++) {
            if(tagsArray[index] === this.buttonsContainer.childNodes[i].value){
              this.setSelected(this.buttonsContainer.childNodes[i]);
            }
          }
      }
    }
  }

  setSelected(btn){
    btn.classList.remove('tagOff');
    btn.classList.add('tagOn');
  }

  setUnselected(btn){
    btn.classList.remove('tagOn');
    btn.classList.add('tagOff');
  }

  getSelectedTags(){
    return $(this.buttonsContainer).find(".tagOn");
  }

  resetSelected(){
    let self = this;
    $(this.buttonsContainer).find('.tagButtons').each(function(index){
       self.setUnselected(this);
    });
  }

  toggleEnableButtons(enable){
    let self = this;
    $(this.buttonsContainer).find('.tagButtons').each(function(index){
      this.disabled = !enable;
    });
  }

}

window.customElements.define('optional-tags', OptionalTags);