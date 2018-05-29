import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import './video-tagging.js';

class TestvideoTagging extends PolymerElement{
    static get template() {
        return html`
        <div >
            <div style="width:65%;margin:100px 0 0 200px">
                <video-tagging id='video-tagging' 
                regiontype="[[regiontype]]" regionsize="[[regionsize]]"
                multiregions="[[multiregions]]" inputtagsarray="[[inputtagsarray]]"
                videoduration="[[videoduration]]" videowidth="[[videowidth]]"
                videoheight="[[videoheight]]" framerate="[[framerate]]"
                src="[[src]]">
                </video-tagging>
            </div>
        </div>
        `;
    }

    static get properties(){
        return {
            regiontype: {
                type: String,
                value: 'Point'
            },
            regionsize: {
                type: Number,
                value: 25
            },
            multiregions: {
                type: Number,
                value: 1
            },
            inputtagsarray: {
                type: Array,
            //    value: ["shoe","stone","hat","shirt","white","brown"]
            },
            videoduration: {
                type: Number,
                value: 21.8
            },
            videowidth: {
                type: Number,
                value: 640
            },
            videoheight: {
                type: Number,
                value: 480
            },
            framerate: {
                type: Number,
                value: 22
            },
            src: {
                type: String,
                value: 'http://localhost:8081/media/mov2.mp4'
            }
        }
    }

    constructor(){
        super();
        this.inputtagsarray=["shoe","stone","hat","shirt","white","brown"]
    }
    ready(){
        super.ready();
        this.set('regiontype','Point');
        /*
        let job = {};
        job.Config = {regiontype:"Point", regionsize:"25", multiregions:"1"};
        job.Config.tags = ["shoe","stone","hat","shirt","white","brown"];
        job.DurationSeconds = 21.8;
        job.FramesPerSecond = 25;
        job.Description = "Job";
        job.id = 2;
        job.video = "/media/mov2.mp4";
        job.Height = 480;
        job.Width = 640;

        let videoTagging =  this.$ .'video-tagging';
        videoTagging.setAttribute('regiontype','Point')

        //const jobConfig = job.Config;
        //console.log(jobConfig)
        videoTagging.regiontype = 'Point';
        videoTagging.multiregions = '1';
        videoTagging.regionsize = '25';
        videoTagging.inputtagsarray = ["shoe","stone","hat","shirt","white","brown"];
        videoTagging.videoduration = job.DurationSeconds;
        videoTagging.videowidth = job.Width;
        videoTagging.videoheight = job.Height;
        videoTagging.framerate = job.FramesPerSecond;
        videoTagging.src = job.video;//load*/
    }
}

window.customElements.define('test-video-tagging', TestvideoTagging);