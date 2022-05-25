<script>
    import Quagga from "quagga-scanner";
    import { onMount, onDestroy, tick } from "svelte";
    import { SkeletonBlock } from "framework7-svelte";
    import { products } from "./store.js";
    export let onDetected = () => {};

    let capabilities = {};
    let usingQG = false;
    let devices = [];
    let results = [];
    let track, streamLabel, interactiveContainer, stream, video;
    let renderedWidthRatio = 1;
    let loading = true;

    $: renderedWidthRatio =
        640 / (interactiveContainer || { scrollWidth: 640 }).scrollWidth;

    let state = {
        inputStream: {
            type: "LiveStream",
            constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: "environment",
                aspectRatio: { min: 1, max: 2 },
                deviceId: localStorage.getItem('preferredCamera') || null
            },
        },
        locator: {
            patchSize: "x-large",
            halfSample: true,
            debug: {
                showCanvas: true,
                showPatches: true,
                showFoundPatches: false,
                showSkeleton: false,
                showLabels: false,
                showPatchLabels: false,
                showRemainingPatchLabels: false,
                boxFromPatches: {
                    showTransformed: false,
                    showTransformedBox: false,
                    showBB: false,
                },
            },
        },
        numOfWorkers: 32,
        frequency: 120,
        decoder: {
            readers: [
                {
                    format: "ean_reader",
                    config: {},
                },
            ],
        },
        locate: true,
    };

    let resultCollector = Quagga.ResultCollector.create({
        capture: true,
        capacity: 1,
        blacklist: [],
        filter: function (codeResult) {
            return true;
        },
    });

    $: window.video = video;
    onMount(async () => {
        if ("BarcodeDetector" in window) {
            const detector = new BarcodeDetector();
            try {
                loading = true;
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: localStorage.getItem('preferredCamera') ? {deviceId: { exact: localStorage.getItem('preferredCamera') } } : true,
                });

                video.srcObject = stream;
                loading = false;
                video.play();
                window.requestAnimationFrame(tick);
                async function tick() {
                    if (video && video.videoHeight) {
                        const bitmap = await createImageBitmap(video);
                        results = await detector.detect(bitmap);
                    }
                    if (results.length === 0) {
                        window.requestAnimationFrame(tick);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        } else {
            usingQG = true;
            Quagga.init(state, async function (err) {
                if (err) {
                    loading = false;
                    return handleError(err);
                }
                loading = false;
                Quagga.start();
                Quagga.registerResultCollector(resultCollector);
                track = Quagga.CameraAccess.getActiveTrack();
                capabilities = track.getCapabilities
                ? track.getCapabilities()
                : {};
                devices = await Quagga.CameraAccess.enumerateVideoDevices();
                
                streamLabel = Quagga.CameraAccess.getActiveStreamLabel();
                
                // resultCollector.getResults()
            });
        }

        Quagga.onProcessed(function (result) {
            var drawingCtx = Quagga.canvas.ctx.overlay,
                drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(
                        0,
                        0,
                        parseInt(drawingCanvas.getAttribute("width")),
                        parseInt(drawingCanvas.getAttribute("height"))
                    );
                    result.boxes
                        .filter(function (box) {
                            return box !== result.box;
                        })
                        .forEach(function (box) {
                            Quagga.ImageDebug.drawPath(
                                box,
                                { x: 0, y: 1 },
                                drawingCtx,
                                { color: "green", lineWidth: 2 }
                            );
                        });
                }

                if (result.box) {
                    Quagga.ImageDebug.drawPath(
                        result.box,
                        { x: 0, y: 1 },
                        drawingCtx,
                        { color: "#00F", lineWidth: 2 }
                    );
                }

                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(
                        result.line,
                        { x: "x", y: "y" },
                        drawingCtx,
                        { color: "red", lineWidth: 3 }
                    );
                }
            }
        });

        Quagga.onDetected(function (result) {
            // const [p1, p2] = result.line;
            // const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;

            Quagga.stop();
            (
                document.querySelector("#interactive video") || {
                    remove: () => 1,
                }
            ).remove();
            Quagga.offDetected();
            results = [
                ...results,
                {
                    code: result.codeResult.code,
                    canvas: Quagga.canvas.dom.image,
                    ...result,
                },
            ];
            // products.setProduct({barcode: result.codeResult.code, ...JSON.parse(JSON.stringify(result))});
            onDetected(result.codeResult.code);
        });

        const handleError = (err, message) => {
            alert(err, message);
        };
    });

    $: if (results.length && video) {
        if (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        console.log("results ", results[0]);
        onDetected(results[0].rawValue);
    }

    onDestroy(() => {
        try {
            if(usingQG) {
                Quagga.stop();
            }
        } catch (error) {
            console.log(error);
        }
        if (video) {
            if (stream) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        }
    });
</script>

<!-- {#if capabilities.zoom}
    <select zoom>
        {#each new Array(6)
            .fill(0)
            .map((e) => (capabilities.zoom.max - capabilities.zoom.min) / 6) as step, index}
            <option value={capabilities.zoom.min + index * step}
                >{capabilities.zoom.min + index * step}</option
            >
        {/each}
    </select>
{/if}

{#if capabilities.torch}
    <select torch>
        <option value="1"> Enabled </option>
        <option value="0"> Disabled </option>
    </select>
{/if} -->

<!-- {#if devices.length}
    <select device>
        {#each devices as device}
            <option value={device.deviceId}
                >{device.label || device.deviceId}</option
            >
        {/each}
    </select>
{/if} -->

{#if loading}
    <div class="skeleton-container skeleton-effect-wave">
        <SkeletonBlock style="width: 100%; height: auto; aspect-ratio: 4/3;" />
    </div>
{/if}
{#if window.BarcodeDetector}
    <video class:hide={loading} style="width: 100%" height="auto" bind:this={video} >
        <track kind="captions" />
    </video>
{:else}
    <div
        class:hide={loading}
        id="interactive"
        class="viewport"
        bind:this={interactiveContainer}
    >
        {#if results.length}
            {#each results as result}
                <img
                    src={result.canvas.toDataURL()}
                    alt="scanned barcode result"
                />
                <div
                    class="codebox"
                    style="transform: translate({result.box[1][0] /
                        renderedWidthRatio}px, {result.box[1][1] /
                        renderedWidthRatio}px) rotate({(result.angle * 180) /
                        Math.PI}deg); width:{Math.hypot(
                        result.box[3][0] - result.box[0][0],
                        result.box[3][1] - result.box[0][1]
                    ) / renderedWidthRatio}px; height: {Math.hypot(
                        result.box[1][0] - result.box[0][0],
                        result.box[1][1] - result.box[0][1]
                    ) / renderedWidthRatio}px"
                >
                    <div
                        class="code"
                        style="font-size: {Math.hypot(
                            result.box[3][0] - result.box[0][0],
                            result.box[3][1] - result.box[0][1]
                        ) /
                            renderedWidthRatio /
                            result.code.length}px"
                    >
                        {result.code}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
{/if}

<!-- {#each results as result}
  <li>
      <div class="thumbnail">
          <div class="imgWrapper">
              <img src="{result.canvas.toDataURL()}" />
          </div>
          <div class="caption">
              <h4 class="code">{result.code}</h4>
          </div>
      </div>
  </li>
{/each} -->
<style>
</style>
