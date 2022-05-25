
<script>
  import { SkeletonBlock, Button } from 'framework7-svelte';
  let video, videoWidth, videoHeight;
  let src, stream;
  let loading = false;
  export let capture = () => {};
  export let cancel = () => {};
  import { onMount, onDestroy } from 'svelte';
  
  onMount(async () => {
    video.addEventListener('loadedmetadata', videometadata => {
      console.log('videometadata', videometadata, video.videoWidth, video.videoHeight);
      videoWidth = video.videoWidth;
      videoHeight = video.videoHeight;
    });
    try {
      loading = true;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: localStorage.getItem('preferredCamera') ? {deviceId: { exact: localStorage.getItem('preferredCamera') } } : true,
      });
      console.log('stream', stream);
      video.srcObject = stream;
      loading = false;
      video.play();
    } catch (error) {
      console.log(error);
    }
  });

  function captureFn() {
    const w = 300;
    const h = videoHeight * w / videoWidth;
    const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, w, h);
    
    if(stream) {
      stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }

    src = canvas.toDataURL('jpeg', 0.6);
    
    capture(src);

  }

  function cancelFn() {
    if(stream) {
      stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }
    cancel();
  }
  onDestroy(cancelFn);
</script>

<div>
  <p>
    {#if loading}
    <div class="skeleton-container skeleton-effect-wave">
      <SkeletonBlock style="width: 100%; height: auto; aspect-ratio: 4/3;" />
    </div>
    {/if}
    <!-- svelte-ignore a11y-media-has-caption -->
    <div class:hide={loading}>
      {#if src}
      <img src={src} alt="scanned barcode result" />
      {:else }
      <video style="width: 100%" bind:this={video} />
      {/if}
    </div>

  <p>
    <Button large raised fill on:click={captureFn}> Çek </Button>
  </p>
  <p>
    <Button large raised fill color="red" on:click={cancelFn}> İptal </Button>
  </p>
</div>