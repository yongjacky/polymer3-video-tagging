const $_documentContainer = document.createElement('template');
$_documentContainer.setAttribute('style', 'display: none;');

$_documentContainer.innerHTML = `<dom-module id="video-taggingstyles">
  <template>
    <style>
        
        /*General*/

        :host {
              display: block;
              box-sizing: border-box;
            }

        .controlWrapper{
            width:100%;
            height:100%;
            border: 0px;
            border-style: solid;
            border-color: green;
            display: none;
            overflow: hidden;
            background-color: rgb(64,64,64);
        }

        .clickableControl{
            cursor: pointer;
        }

        .relativeDiv{
            position:relative;
        }


        /*Video area*/

        .overlaystyle {
          position: absolute; 
          z-index: 20;
          border:0px solid green;
        }

       .videoStyle {
           z-index: 2;
           width: 100%;
           background: transparent;
           background-size: contain; 
           background-repeat: no-repeat;
           background-position: 50% 50%;
           box-sizing: border-box;                    
        }

        /*playback*/

        .playSpeedControl  {
            
            background:black;
            z-index:20000;
            color:white;
            position: absolute;
            border:.08em solid white;
            display: none;
        }

        .playSpeedValues{
            padding:.2em;
            color: rgb(191,191,191);
            text-align: center;
            font-family: Arial;
        }

        .playSpeedValueSelected{
            color: rgb(255,255,255);
            
        }


        /*region div and label*/
        .regionLabel{
            background:rgb(59,56,56); 
            position:absolute; 
            z-index:50000;
            color:white;
            font-family: "Arial";
            display: block;
            opacity:.90;
            width:40px;height:20px;
        }

        .regionLabelSpan{
            padding-left: .3em;
            color:rgb(175,171,171);
        }

        .regionCanvas{    
            z-index: 100;
            background-color: transparent;
            position: absolute !important;
            border: 4px solid blue;
            border-radius: 8px;
        }

        .regionPoint{
            border: none;
            /*add an x from http://stackoverflow.com/questions/18012420/draw-diagonal-lines-in-div-background-with-css*/
            background: 
            linear-gradient(to top left,
                rgba(0,0,0,0) 0%,
                rgba(0,0,0,0) calc(50% - 0.8px),
                rgba(0,0,0,1) 50%,
                rgba(0,0,0,0) calc(50% + 0.8px),
                rgba(0,0,0,0) 100%),
            linear-gradient(to top right,
                rgba(0,0,0,0) 0%,
                rgba(0,0,0,0) calc(50% - 0.8px),
                rgba(0,0,0,1) 50%,
                rgba(0,0,0,0) calc(50% + 0.8px),
                rgba(0,0,0,0) 100%);
        }


        .regionCanvasSelected{
            border: 4px solid #C00000;
            border-radius: 8px;
        }


        .closeRegion{
            float:right; 
            color: rgb(255,0,0);
            padding-right: .2em;
        }


        /*video controls*/
        .videoControls  {
            
            width:100%;
            background-color: black;
            margin-top: -6px;
        }

        .videoControlsTable{
            border: 0px solid red;
            margin-left:1%;
            margin-right:1%;
        }

        .videoControlCell{
            text-align:center;
            padding-top: 1em;
            padding-bottom: 1em;
        }

        .seekCell{
            padding-left: 1em;
            padding-right: 1.5em;
        }

        .volumeControlCell{
            text-align:left;
        }

        .simpleControl {
            width:5%;
        }

        .longControl{
            width:10%;
        }

        .frameNumber{
            width:15%;
        }

        .textElements{
            font-family:arial;
            color:white;
            text-align: center;
        }


        /*tagging controls*/
        .videoTagControls  {
            
            border: rgb(38,38,38,0.25);
            background-color: black;
            margin-top:.15em;
            padding-bottom: .5em;
        }


        .optionalTags{
            float: left;
            width: 85%;
            margin: 1em 0 0 1.5em;
        }

        .labelControls {
            float:right;
            margin: 1em 0 0 0;
            width:10%;
        }

        .lockTag{
            padding-left: .4em;
            
        }

        .taggingControls{
            color:rgb(255,255,255);
            font-size: 130%;
            cursor:pointer;
            text-align: center; 
        }

        .controlOn{
            color:rgb(255,255,255);
        }

        .controlOff{
            color:rgb(89,89,89);
        }     

        .tagButtons{
            margin-bottom: 10px;
            margin-left: 5px;
            background : rgb(59,56,56);
            color:rgb(127,127,127);
            max-width: 200px;
            min-width: 20px;
            font-family: Arial;
            font-size: 15px;
            border: 1px solid rgb(64,64,64);
            border-radius: 5px;
        }

        .tagOn{
            background:rgb(217,217,217);
        }

        .tagOff{
            background:rgb(59,56,56);
        }

    </style> 
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);

/*
   video-taggingstyles contains the styles of the video-tagging module
       
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
;
