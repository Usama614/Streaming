// Import necessary modules
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
// Import 'mjpegcanvas' as any since it doesn't have TypeScript declarations
// const MJPEGCANVAS: any = require('mjpegcanvas');
// import * as MJPEGCANVAS  from "mjpegcanvas";
declare var MediaSource: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer: any;
  private videoSocket!: Socket;
  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream | null;
  videoFrames: any;
  count: number = 0;
  public videoElement!: HTMLVideoElement;
  constructor() {
    // Replace 'http://192.168.41.15:60276' with the actual URL of your Socket.IO server
    // this.videoSocket = new Socket({ url: 'http://192.168.41.15:60276', options: {} });
  }

  ngOnInit() {
    // this.videoElement = document.getElementById('video') as HTMLVideoElement;
    
    // this.videoSocket.fromEvent('connect').subscribe(() => {
    //   console.log('Socket connected');
    //   // this.initWebRTC();
    // });

    // this.videoSocket.fromEvent('message').subscribe((data: any) => {
    //   this.handleVideoData(data);
    // });
    
    // this.videoSocket.fromEvent('offer').subscribe((offer: any)=>{
    //   console.log(offer)
    // })
  }

  ngAfterViewInit() {
    // This is where you can safely access this.videoPlayer.nativeElement
    // const videoPlayer = this.videoPlayer.nativeElement;
    // navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    //   .then((stream) => {
    //     this.localStream = stream;
    //     videoPlayer.srcObject = stream;
    //   })
    //   .catch((error) => {
    //     console.error('Error accessing media devices:', error);
    //   });
  }

  ngOnDestroy() {
    // Close the connection when the component is destroyed
    this.videoSocket.disconnect();
    // this.closePeerConnection();
  }

  connectAll(){
    console.log("Connecting...")
    this.count = 0;
    const configuration = { iceServers: 
      [{credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=' ,urls: ['stun:stun.l.google.com:19302','turn:192.158.29.39:3478?transport=udp'],username: '28224511:1379330808'}] };
    this.peerConnection = new RTCPeerConnection(configuration);
    this.videoSocket = new Socket({ url: 'https://sessiontest.sofy.ai:3000', options: {withCredentials:true} });
    this.videoSocket.fromEvent('connect').subscribe(() => {
      console.log('Socket connected');
      // this.initWebRTC();
    });

    this.videoSocket.fromEvent('message').subscribe((data: any) => {
      // this.handleVideoData(data);
    });
    
    this.videoSocket.fromEvent('offer').subscribe((offer: any)=>{
      console.log(offer)
      this.getOffer(offer)
    })

    // Listen for remote ice candidates
    this.videoSocket.fromEvent<{ candidate: RTCIceCandidate }>('ice-candidate').subscribe((data: any) => {
      const candidate = JSON.parse(data)
      console.log(data,candidate)
      if (candidate.candidate) {
        this.peerConnection.addIceCandidate(candidate.candidate)
          .then(()=> console.log("ICE candidate added."))
          .catch((error) => console.error('Error adding ICE candidate:', error));
      }
    });
    
    this.peerConnection.ondatachannel = ((event)=>{
      console.log(event)
      // this.videoSocket.emit('frame', '*');
      event.channel.onmessage = (event) => {
        console.log(event.data);
        this.handleVideoData(event.data)
        // this.videoFrames = event.data
      };
    }) 
    
  }

  disconnectAll(){
    console.log("Disconnecting...")
    this.videoSocket.disconnect()
    this.closePeerConnection();  
  }

  async getOffer(offer: any){
    // Assume you have the offer from the server stored in a variable named 'offerFromServer'
    // Parse the offer (you need to implement the parsing logic based on your server)
    const data = JSON.parse(offer)

    console.log(data)
   
    // Set the remote description
    if(data?.type === 'offer'){
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));

      // Create and set the local description (generate the answer)
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
    
      // Send the answer back to the server
      this.videoSocket.emit('answer', JSON.stringify(this.peerConnection.localDescription));
       // Set up event handlers for peer connection
       this.peerConnection.onicecandidate = (event) => {
        console.log(event)
        if (event.candidate) {
          const candidate = {
            candidate: event.candidate,
            type: "candidate"
          }
          console.log(candidate)
          this.videoSocket.emit('ice-candidate',   JSON.stringify(candidate) );
        }
      };

      this.peerConnection.oniceconnectionstatechange = (event) => {
        console.log(event)
        console.log('ICE Connection State:', this.peerConnection.iceConnectionState);
      
      };


    }

       // this.peerConnection.ontrack = (event) => {
      //   console.log(event)
      //   const remoteVideo = this.videoPlayer.nativeElement;
      //   remoteVideo.srcObject = event.streams[0];
      // };

    
  }

  private initWebRTC() {
    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    this.peerConnection = new RTCPeerConnection(configuration);
    let offerVar:any
    this.peerConnection.createOffer()
    .then((offer) => {
      console.log(offer)
      this.peerConnection.setLocalDescription(offer)
      offerVar = offer
    })
    .then(() => {
      console.log(offerVar )
      this.videoSocket.emit('offer', { offer: offerVar })})
    .catch((error) => console.error('Error creating offer:', error));
  

    // Add local stream to peer connection
    // if (this.localStream) {
    //   this.localStream.getTracks().forEach((track) => {
    //     this.peerConnection.addTrack(track, this.localStream!);
    //   });
    // }

    // // Set up event handlers for peer connection
    // this.peerConnection.onicecandidate = (event) => {
    //   if (event.candidate) {
    //     this.videoSocket.emit('ice-candidate', { candidate: event.candidate });
    //   }
    // };

    // this.peerConnection.oniceconnectionstatechange = (event) => {
    //   console.log('ICE Connection State:', this.peerConnection.iceConnectionState);
    // };

    // this.peerConnection.ontrack = (event) => {
    //   const remoteVideo = this.videoPlayer.nativeElement;
    //   remoteVideo.srcObject = event.streams[0];
    // };

    // // Listen for remote ice candidates
    // this.videoSocket.fromEvent<{ candidate: RTCIceCandidate }>('ice-candidate').subscribe((data) => {
    //   if (data.candidate) {
    //     this.peerConnection.addIceCandidate(data.candidate)
    //       .catch((error) => console.error('Error adding ICE candidate:', error));
    //   }
    // });

    // Create and send offer to remote peer
    // this.peerConnection.createOffer()
    //   .then((offer) => {
    //     console.log(offer)
    //     this.peerConnection.setLocalDescription(offer)})
    //   .then(() => {
    //     console.log(this.peerConnection.localDescription )
    //     this.videoSocket.emit('offer', { offer: this.peerConnection.localDescription })})
    //   .catch((error) => console.error('Error creating offer:', error));
  }

  // private handleVideoData(data: any) {
    // Handle video data received from the socket
    // This could be the offer or answer from the other peer
    // if (data.type === 'offer' || data.type === 'answer') {
    //   console.log("OFFER")
    //   const remoteDescription = new RTCSessionDescription(data);
    //   this.peerConnection.setRemoteDescription(remoteDescription)
    //     .then(() => {
    //       if (data.type === 'offer') {
    //         console.log(data)
    //         return this.peerConnection.createAnswer();
    //       }
    //       else if (data.type === 'answer') {
    //         console.log("ANSWER")
    //         console.log(data)
    //         // Handle the answer from the other peer
    //         const remoteDescription = new RTCSessionDescription(data);
    //         this.peerConnection.setRemoteDescription(remoteDescription)
    //           .catch((error) => console.error('Error setting remote description:', error));
    //       }
    //       return;
    //     })
    //     .then((answer) => this.peerConnection.setLocalDescription(answer))
    //     .then(() => this.videoSocket.emit('answer', { answer: this.peerConnection.localDescription }))
    //     .catch((error) => console.error('Error setting remote description:', error));
    // } 
  // }

  private handleVideoData(data: any) {
    console.log("Connected")
    // console.log(this.videoPlayer)
    // const videoPlayer = this.videoPlayer.nativeElement;
    // const imageData = new Uint8Array(data);
    // const blob = new Blob([imageData], { type: 'image/jpeg' });
    // console.log(data)
    // console.log(blob)
    // console.log(this.videoPlayer.nativeElement)
    // console.log(videoPlayer)
    // const url = URL.createObjectURL(blob);
    // // this.videoSrc = URL.createObjectURL(blob);
    // console.log(url)
    // videoPlayer.src = url;
    // console.log(videoPlayer.src)

    // // Assuming 'data' is your ArrayBuffer
    
    // console.log(this.videoPlayer)
    // URL.revokeObjectURL(url)
    // ...
  console.log("Connected");

    // const videoPlayer = this.videoPlayer.nativeElement;
    // const uint8Array = new Uint8Array(data);
    // const blob = new Blob([uint8Array], { type: 'video/webm' });
    // if (this.videoFrames) {
    //   URL.revokeObjectURL(this.videoFrames);
    // }
    // this.videoFrames = URL.createObjectURL(blob);
    // videoPlayer.src = this.videoFrames
  // const videoPlayer = this.videoPlayer.nativeElement;

  // // Assuming 'data' is your ArrayBuffer
  // let uint8Array = new Uint8Array(data);

  // const blob = new Blob([uint8Array],{type: "video/webm"})
  // this.videoFrames = URL.createObjectURL(blob);
  // // Get the video element by its ID
  // let mediaSource = new MediaSource();
  // videoPlayer.src = URL.createObjectURL(mediaSource);

  // mediaSource.addEventListener('sourceopen', () => {
  //   let sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="avc1.42E01E"'); // Adjust codecs based on your video format

  //   // Append the binary data to the source buffer
  //   sourceBuffer.addEventListener('updateend', function () {
  //     // Continue appending chunks of data as they arrive
  //   });

  //   sourceBuffer.appendBuffer(uint8Array);
  // });

//   const canvas = document.getElementById('mjpeg-canvas') as HTMLCanvasElement;
//   const uint8Array = new Uint8Array(data);
//    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
   
//  const mjpegUrl = `${blob}`;

//  const player = new MJPEGCANVAS.Video({
//    canvas: canvas,
//    url: mjpegUrl,
//    onStart: function () {
//      console.log('MJPEG stream started');
//    },
//    onStop: function () {
//      console.log('MJPEG stream stopped');
//    },
//    onError: function (error: any) {
//      console.error('Error in MJPEG stream:', error);
//    },
//  });

//  player.start();
var BLANK_IMG =
'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    var canvas:any = document.getElementById('canvas');
    var g = canvas.getContext('2d');
    console.log('frame count = ',this.count++, new Date)
    var blob:any = new Blob([data], { type: 'image/jpeg' });
    var URL = window.URL || window.webkitURL;
    var img:any = new Image();

    var u;
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      g.drawImage(img, 0, 0);
      img.onload = null;
      img.src = BLANK_IMG;
      img = null;
      u = null;
      blob = null;
    };

    u = URL.createObjectURL(blob);
    img.src = u;

  }

  // video-display.component.ts
    getVideoSource(frames: any): void {
      const blob = new Blob([frames], { type: 'video/mp4' });
      this.videoElement.src = URL.createObjectURL(blob);
  }


  private closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null!;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}
