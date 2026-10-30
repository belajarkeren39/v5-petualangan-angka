
/* ============================================================================
   1. GENERATOR SOAL OPERASI HITUNG BILANGAN CACAH (KELAS 1–6)
   MODE MUDAH: satu operasi, angka kecil, tanpa menyimpan/meminjam.
   ============================================================================ */
const GRADE_INFO = {
  K1: { n: 1, max: 5, label: "Kelas 1 • Mudah", range: "0–5" },
  K2: { n: 2, max: 20, label: "Kelas 2 • Mudah", range: "0–20" },
  K3: { n: 3, max: 50, label: "Kelas 3 • Mudah", range: "0–50" },
  K4: { n: 4, max: 100, label: "Kelas 4 • Mudah", range: "0–100" },
  K5: { n: 5, max: 200, label: "Kelas 5 • Mudah", range: "0–200" },
  K6: { n: 6, max: 500, label: "Kelas 6 • Mudah", range: "0–500" }
};
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[rnd(0, arr.length - 1)];
const fmt = n => Number(n).toLocaleString("id-ID");
let QID = 0;
const NAMES = ["Raka", "Sinta", "Bima", "Dewi", "Arka", "Lina", "Dodi", "Maya"];
const ITEMS = ["kelereng", "apel", "buku", "pensil", "stiker", "jeruk", "kancing", "kartu"];

function genParts(g, op) {
 const L = GRADE_INFO["K" + g].max;
 if (op === "+" || op === "-") {
   let a,b; const unit=g>=5?10:1;
   do { a=rnd(1,Math.floor((L-unit)/unit))*unit; b=rnd(1,Math.floor((L-a)/unit))*unit; }
   while (String(a).split("").reverse().some((d,i)=>Number(d)+(Math.floor(b/10**i)%10)>9));
   return op==="+"?{a,b,r:a+b}:{a:a+b,b,r:a};
 }
 const tables={3:[2,3,5],4:[2,3,4,5],5:[2,3,4,5,10],6:[2,3,4,5,6,7,8,9,10]};
 const a=rnd(1,g===3?5:10),b=pick(tables[g]);
 return op==="×"?{a,b,r:a*b}:{a:a*b,b,r:a};
}
function makeOpts(ans, L) {
  const mag = Math.max(1, Math.pow(10, String(ans).length - 2));
  const offs = [1, -1, 2, -2, 3, -3, 10, -10, 20, -20, mag, -mag, 2 * mag, -2 * mag, 5 * mag, -5 * mag]
    .sort(() => Math.random() - 0.5);
  const set = new Set();
  for (const o of offs) {
    const v = ans + o;
    if (v >= 0 && v <= L && v !== ans) set.add(v);
    if (set.size >= 3) break;
  }
  for (let k = 1; set.size < 3; k++) {
    if (ans + k <= L) set.add(ans + k);
    if (set.size < 3 && ans - k >= 0) set.add(ans - k);
  }
  return [ans, ...set].map(fmt);
}

function genQuestion(g) {
 const L=GRADE_INFO["K"+g].max;
 const op=pick(g<=2?["+","-"]:["+","-","×","÷"]),s=op==="-"?"−":op;
 const {a,b,r}=genParts(g,op); let text;
 if (Math.random()<0.8) text="Hitunglah: "+fmt(a)+" "+s+" "+fmt(b)+" = ▢";
 else { const n=pick(NAMES),it=pick(ITEMS);
  if(op==="+")text=n+" punya "+fmt(a)+" "+it+", lalu mendapat "+fmt(b)+" lagi. Berapa jumlahnya?";
  else if(op==="-")text=n+" punya "+fmt(a)+" "+it+", lalu memberi "+fmt(b)+" kepada teman. Berapa sisanya?";
  else if(op==="×")text="Ada "+fmt(a)+" kotak, masing-masing berisi "+fmt(b)+" "+it+". Berapa jumlahnya?";
  else text=fmt(a)+" "+it+" dibagi rata ke "+fmt(b)+" kotak. Berapa isi tiap kotak?";
 }
 return {id:"K"+g+"-"+(++QID),difficulty:"K"+g,question:text,options:makeOpts(r,L),explanation:fmt(a)+" "+s+" "+fmt(b)+" = "+fmt(r)+"."};
}
/* ============================================================================
   2. MANAJER AUDIO (WEB AUDIO API SINTETIS 8-BIT + LOADER FILE OPSIONAL)
   ============================================================================ */
class GameAudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicVolume = 0.28;
    this.sfxVolume = 0.45;
    this.currentMusicKey = null;
    this.musicLoopTimer = null;
    this.activeHtmlAudio = null;
    this.stepIndex = 0;

    this.optionalPaths = {
      menu_theme: "asset/audio/menu_theme.mp3",
      gameplay_theme: "asset/audio/gameplay_theme.mp3",
      click: "asset/audio/click.mp3",
      correct: "asset/audio/correct.mp3",
      wrong: "asset/audio/wrong.mp3",
      win: "asset/audio/win.mp3",
      lose: "asset/audio/lose.mp3"
    };
    this.fileCacheStatus = {};
    this.htmlAudioElements = {};

    this.loadPreferences();
  }

  loadPreferences() {
    try {
      const savedMute = localStorage.getItem("petualangan_angka_mute");
      if (savedMute !== null) this.muted = savedMute === "true";
    } catch (e) {}
  }

  savePreferences() {
    try {
      localStorage.setItem("petualangan_angka_mute", String(this.muted));
    } catch (e) {}
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try { this.ctx = new AudioCtx(); } catch (e) {}
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.initContext();
    this.muted = !this.muted;
    this.savePreferences();
    if (this.muted) {
      this.stopMusic();
    } else if (this.currentMusicKey) {
      const keyToResume = this.currentMusicKey;
      this.currentMusicKey = null;
      this.playMusic(keyToResume);
    }
    return this.muted;
  }

  tryOptionalAudio(key, isLoop = false, onFallback) {
    if (this.fileCacheStatus[key] === "failed") {
      onFallback();
      return;
    }

    const path = this.optionalPaths[key];
    if (!path) {
      onFallback();
      return;
    }

    let audio = this.htmlAudioElements[key];
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      audio.src = path;
      this.htmlAudioElements[key] = audio;
    }

    audio.loop = isLoop;
    audio.volume = isLoop ? this.musicVolume : this.sfxVolume;

    let settled = false;
    const fallbackTrigger = () => {
      if (settled) return;
      settled = true;
      this.fileCacheStatus[key] = "failed";
      onFallback();
    };

    const timer = setTimeout(fallbackTrigger, 350);
    audio.onerror = fallbackTrigger;

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (settled) {
            audio.pause();
            return;
          }
          settled = true;
          clearTimeout(timer);
          this.fileCacheStatus[key] = "ready";
          if (isLoop) {
            if (this.currentMusicKey !== key || this.muted) {
              audio.pause();
            } else {
              this.activeHtmlAudio = audio;
            }
          }
        }).catch(fallbackTrigger);
      }
    } catch (err) {
      fallbackTrigger();
    }
  }

  stopMusic() {
    if (this.musicLoopTimer) {
      clearInterval(this.musicLoopTimer);
      this.musicLoopTimer = null;
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch (e) {}
      this.activeHtmlAudio = null;
    }
  }

  playMusic(key) {
    this.currentMusicKey = key;
    this.stopMusic();
    if (this.muted) return;
    this.initContext();

    this.tryOptionalAudio(key, true, () => {
      if (this.muted || this.currentMusicKey !== key) return;
      this.startSynthMusicLoop(key);
    });
  }

  startSynthMusicLoop(key) {
    this.stopMusic();
    if (!this.ctx || this.muted) return;

    this.stepIndex = 0;
    const menuNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 349.23];
    const gameNotes = [329.63, 392.00, 440.00, 523.25, 493.88, 440.00, 392.00, 329.63, 293.66, 349.23, 392.00, 440.00];
    const seq = key === "menu_theme" ? menuNotes : gameNotes;
    const tempoMs = key === "menu_theme" ? 290 : 230;

    this.musicLoopTimer = setInterval(() => {
      if (this.muted || !this.ctx || document.hidden) return;
      const freq = seq[this.stepIndex % seq.length];
      this.playTone(freq, tempoMs / 1000 * 0.75, key === "menu_theme" ? "triangle" : "square", this.musicVolume * 0.45);
      if (this.stepIndex % 2 === 0) {
        this.playTone(freq / 2, tempoMs / 1000 * 0.6, "triangle", this.musicVolume * 0.35);
      }
      this.stepIndex++;
    }, tempoMs);
  }

  playTone(freq, duration, type = "square", gainVal = 0.2, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {}
  }

  playSfx(key) {
    if (this.muted) return;
    this.initContext();

    this.tryOptionalAudio(key, false, () => {
      if (this.muted || !this.ctx) return;
      switch (key) {
        case "click":
          this.playTone(587.33, 0.09, "square", this.sfxVolume * 0.5);
          break;
        case "correct":
          this.playTone(523.25, 0.11, "square", this.sfxVolume * 0.6, 0);
          this.playTone(659.25, 0.11, "square", this.sfxVolume * 0.6, 0.09);
          this.playTone(783.99, 0.18, "triangle", this.sfxVolume * 0.7, 0.18);
          break;
        case "wrong":
          this.playTone(311.13, 0.16, "sawtooth", this.sfxVolume * 0.5, 0);
          this.playTone(233.08, 0.24, "sawtooth", this.sfxVolume * 0.5, 0.15);
          break;
        case "win":
          [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
            this.playTone(f, 0.22, "square", this.sfxVolume * 0.65, idx * 0.14);
          });
          break;
        case "lose":
          [392.00, 349.23, 329.63, 261.63].forEach((f, idx) => {
            this.playTone(f, 0.24, "triangle", this.sfxVolume * 0.6, idx * 0.16);
          });
          break;
      }
    });
  }
}

/* ============================================================================
   3. DETEKTOR KHUSUS TELAPAK TANGAN (21 HAND LANDMARKS - ANTI WAJAH / BADAN)
   Menggunakan MediaPipe HandLandmarker untuk mendeteksi 21 titik anatomi telapak
   tangan & jari secara spesifik. Wajah, kepala, bahu, dan badan diabaikan 100%.
   ============================================================================ */
class PalmOnlyDetector {
  constructor(videoEl, overlayCanvasEl) {
    this.video = videoEl;
    this.canvas = overlayCanvasEl;
    this.ctx = this.canvas.getContext("2d");

    this.cameraReady = false;
    this.modelReady = false;
    this.modelLoading = false;
    this.modelError = null;
    this.handLandmarker = null;
    this.stream = null;

    this.detectedPalms = [];
    this.persistedPalms = [];
    this.palmPersistenceMs = 220;
    this.lastVideoTime = -1;
    this.particles = [];
    this.punchSpeed = 0.75; // tinggi layar per detik
  }



  async initHandModel() {
    if(this.modelReady)return;
    if(this._modelPromise)return this._modelPromise;
    this.modelLoading=true;this.modelError=null;
    this._modelPromise=(async()=>{
      const useCPU=document.getElementById("select-sensor-mode")?.value==="CPU" || this.forceCPU;
      const delegates=useCPU?["CPU"]:["GPU","CPU"];
      let vision,files,modelOptions;
      try{
        if(location.protocol==="file:"){
          const local=await LocalSensorLoader.prepare();
          vision=local.vision;files=local.files;modelOptions={modelAssetBuffer:local.modelAssetBuffer};
        }else{
          const base=new URL("aset/sensor/",document.baseURI).href;
          vision=await import(base+"vision_bundle.mjs");
          files=await vision.FilesetResolver.forVisionTasks(base+"wasm");
          modelOptions={modelAssetPath:base+"hand_landmarker.task"};
        }
        for(const delegate of delegates){
          try{
            this.handLandmarker=await vision.HandLandmarker.createFromOptions(files,{
              baseOptions:{...modelOptions,delegate},runningMode:"VIDEO",numHands:2,
              minHandDetectionConfidence:.35,minHandPresenceConfidence:.35,minTrackingConfidence:.35
            });
            this.delegate=delegate;this.modelReady=true;this.modelError=null;
            this._detectErrors=0;this.lastVideoTime=-1;return;
          }catch(e){this.modelError=e.message||String(e);}
        }
      }catch(e){this.modelError=e.message;}
      this.modelError="Sensor belum siap. "+(location.protocol==="file:"?"Versi GitHub ini harus dibuka lewat alamat https:// (GitHub Pages), bukan file lokal. ":"Muat ulang halaman, lalu coba Mode Kompatibel (CPU). ")+(this.modelError||"");
    })();
    try{await this._modelPromise;}finally{this.modelLoading=false;this._modelPromise=null;}
  }
  async listCameras() {
    const select = document.getElementById("select-camera");
    if (!select || !navigator.mediaDevices?.enumerateDevices) return;
    const selected = select.value;
    const devices = await navigator.mediaDevices.enumerateDevices();
    select.replaceChildren(new Option("Kamera bawaan / otomatis", ""));
    devices.filter(d => d.kind === "videoinput").forEach((d, i) =>
      select.add(new Option(d.label || "Kamera " + (i + 1), d.deviceId)));
    if ([...select.options].some(o => o.value === selected)) select.value = selected;
  }

  async startCamera() {
    if (this._cameraPromise) return this._cameraPromise;
    this._cameraPromise = this.openCamera();
    try { return await this._cameraPromise; } finally { this._cameraPromise = null; }
  }

  async openCamera() {
    this.cameraError = null;
    this._runtimeFailed = false;
    this.cameraReady = false;
    this.detectedPalms = []; this.persistedPalms = [];
    document.getElementById("arena-container").classList.remove("camera-on");
    try {
      if (!window.isSecureContext) throw new Error("Kamera memerlukan HTTPS atau localhost. Alamat HTTP jaringan lokal tidak dapat membuka kamera.");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Chrome ini belum menyediakan akses kamera. Perbarui Chrome dan izinkan kamera untuk situs ini.");
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      const deviceId = document.getElementById("select-camera")?.value || "";
      let video = { width: {ideal:640}, height: {ideal:480}, frameRate: {ideal:24, max:30} };
      if (deviceId) video.deviceId = {exact:deviceId};
      try { this.stream = await navigator.mediaDevices.getUserMedia({audio:false, video}); }
      catch (e) {
        if (e.name !== "OverconstrainedError") throw e;
        this.stream = await navigator.mediaDevices.getUserMedia({audio:false, video:deviceId ? {deviceId:{exact:deviceId}} : true});
      }
      this.video.muted = true; this.video.playsInline = true;
      this.video.setAttribute("webkit-playsinline","");this.video.disablePictureInPicture=true;
      this.video.srcObject = this.stream;
      await this.video.play();
      this.cameraReady = true;
      this.lastVideoTime = -1;
      document.getElementById("arena-container").classList.add("camera-on");
      const track = this.stream.getVideoTracks()[0];
      track.addEventListener("ended", () => {
        this.cameraReady = false; this.detectedPalms = []; this.persistedPalms = [];
        this.cameraError = "Kamera terputus. Tekan Hubungkan Kamera untuk mencoba lagi.";
        document.getElementById("arena-container").classList.remove("camera-on");
      }, {once:true});
      await this.listCameras().catch(() => {});
      await this.initHandModel();
      return {ok:true, modelReady:this.modelReady, error:this.modelError};
    } catch(e) {
      if (this.stream) this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
      this.video.srcObject = null;
      const messages = {
        NotAllowedError:"Izin kamera ditolak. Izinkan Kamera di setelan situs Chrome dan izin aplikasi Chrome pada IFP.",
        NotFoundError:"Kamera tidak ditemukan oleh Chrome. Periksa kamera bawaan dan pengaturan perangkat IFP.",
        NotReadableError:"Kamera sedang dipakai aplikasi lain atau belum dapat dibuka. Tutup aplikasi kamera/rapat, lalu coba lagi.",
        OverconstrainedError:"Kamera yang dipilih tidak tersedia. Pilih kamera bawaan/otomatis lalu coba lagi."
      };
      this.cameraError = messages[e.name] || e.message;
      return {ok:false, modelReady:this.modelReady, error:this.cameraError};
    }
  }

  updateStatus() {
    const label = document.getElementById("sensor-live-detail");
    const badge = document.getElementById("detector-badge");
    let message;
    if (this._cameraPromise && !this.cameraReady) message = "Menunggu izin kamera di Chrome…";
    else if (this.cameraError) message = this.cameraError;
    else if (!this.cameraReady) message = "Kamera belum aktif • klik/sentuh tetap tersedia";
    else if (this.modelLoading) message = "Kamera aktif • memuat sensor tangan…";
    else if (!this.modelReady) message = this.modelError || "Kamera aktif • sensor belum siap";
    else if (this.video.readyState < 2) message = "Menunggu gambar dari kamera…";
    else {
      const count = this.detectedPalms.length;
      message = "Kamera aktif • sensor siap • " + count + " tangan";
      if (count === 0) message += " • angkat telapak tangan ke kamera";
      if (this._inferenceMs) message += " • proses " + Math.round(this._inferenceMs) + " ms";
    }
    if (label) label.textContent = message;
    const pill=document.getElementById("camera-status-pill");
    if(pill && this.cameraReady){pill.textContent=this.modelReady?"✅ Kamera aktif • sensor siap ("+this.delegate+")":(this.modelLoading?"⏳ Memuat sensor lokal…":"⚠️ Gambar aktif • model belum siap");}
    if (badge) badge.textContent = this.cameraReady && this.modelReady
      ? "🖐️ " + this.detectedPalms.length + " tangan terdeteksi" : "📷 Sensor belum siap";
  }
  // Hitung pemetaan koordinat kamera (object-fit: contain & mirror scaleX(-1)) ke kontainer 16:9
  getVideoDisplayBox() {
    const arenaRect = this.canvas.getBoundingClientRect();
    const screenW = arenaRect.width || window.innerWidth || 1;
    const screenH = arenaRect.height || window.innerHeight || 1;
    const vw = this.video.videoWidth || 1280;
    const vh = this.video.videoHeight || 720;

    const videoAspect = vw / vh;
    const screenAspect = screenW / screenH;

    let renderW, renderH, offsetX, offsetY;
    if (screenAspect > videoAspect) {
      renderH = screenH;
      renderW = screenH * videoAspect;
      offsetX = arenaRect.left + (screenW - renderW) / 2;
      offsetY = arenaRect.top;
    } else {
      renderW = screenW;
      renderH = screenW / videoAspect;
      offsetX = arenaRect.left;
      offsetY = arenaRect.top + (screenH - renderH) / 2;
    }
    return {
      renderW,
      renderH,
      offsetX,
      offsetY,
      screenW,
      screenH,
      arenaLeft: arenaRect.left,
      arenaTop: arenaRect.top,
      arenaCenterX: arenaRect.left + screenW * 0.5
    };
  }

  isValidPalmGeometry(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const pinkyMcp = landmarks[17];

    const palmLength = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);
    const palmWidth = Math.hypot(indexMcp.x - pinkyMcp.x, indexMcp.y - pinkyMcp.y);

    if (palmLength < 0.015 || palmLength > 0.65) return false;
    if (palmWidth < 0.012 || palmWidth > 0.65) return false;

    return true;
  }

  detectPalmsInFrame() {
    if (this.video.paused && this.stream && this.cameraReady) this.video.play().catch(() => {});
    const track = this.stream && this.stream.getVideoTracks()[0];
    if (!this.cameraReady || !this.modelReady || !this.handLandmarker || this.video.readyState < 2) {
      this.detectedPalms = [];
      return this.detectedPalms;
    }

    const nowMs = performance.now();
    if (this.video.currentTime !== this.lastVideoTime && nowMs - (this._lastInferenceAt || 0) >= Math.max(50, this._inferenceMs || 0)) {
      this._lastInferenceAt = nowMs;
      this.lastVideoTime = this.video.currentTime;
      try {
        const started = performance.now();
        const results = this.handLandmarker.detectForVideo(this.video, nowMs);
        const detectedAt = performance.now();
        this._inferenceMs = detectedAt - started;
        this.palmPersistenceMs = Math.max(220,Math.min(650,this._inferenceMs*2.5));
        this._detectErrors = 0;
        this._processedFrames=(this._processedFrames||0)+1;
        this._rawHandCount=results?.landmarks?.length||0;
        const box = this.getVideoDisplayBox();
        const rawPalms = [];

        if (results && results.landmarks) {
          for (let i = 0; i < results.landmarks.length; i++) {
            const lm = results.landmarks[i];
            if (!this.isValidPalmGeometry(lm)) continue;

            const palmCenterNormX = (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5;
            const palmCenterNormY = (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5;

            const screenX = box.offsetX + (1 - palmCenterNormX) * box.renderW;
            const screenY = box.offsetY + palmCenterNormY * box.renderH;

            const screenLandmarks = lm.map(pt => ({
              x: box.offsetX + (1 - pt.x) * box.renderW,
              y: box.offsetY + pt.y * box.renderH
            }));

            const wristScreen = screenLandmarks[0];
            const middleMcpScreen = screenLandmarks[9];
            const palmRadiusPx = Math.max(34, Math.min(80, Math.hypot(middleMcpScreen.x - wristScreen.x, middleMcpScreen.y - wristScreen.y) * 0.95));

            const duplicate = rawPalms.find(p => Math.hypot(p.x - screenX, p.y - screenY) < palmRadiusPx * 0.8);
            if (!duplicate) {
              rawPalms.push({
                x: screenX,
                y: screenY,
                radius: palmRadiusPx,
                landmarks: screenLandmarks,
                lastSeen: detectedAt, ttl:this.palmPersistenceMs,
                rawX: screenX, rawY: screenY, rawR: palmRadiusPx,
                lastPunchAt: 0, punchPending: false, flashUntil: 0
              });
            }
          }
        }


        if(rawPalms.length>0){
          const matched=new Set();
          this.persistedPalms=rawPalms.map(newP=>{
            const prev=this.persistedPalms.filter(p=>!matched.has(p.trackId))
              .sort((a,b)=>Math.hypot(a.x-newP.x,a.y-newP.y)-Math.hypot(b.x-newP.x,b.y-newP.y))
              .find(p=>Math.hypot(p.x-newP.x,p.y-newP.y)<Math.max(100,box.screenW*.28));
            if(prev)matched.add(prev.trackId);
            const lm=newP.landmarks;
            const span=Math.hypot(lm[5].x-lm[17].x,lm[5].y-lm[17].y);
            const x=prev?prev.x*.25+newP.x*.75:newP.x, y=prev?prev.y*.25+newP.y*.75:newP.y;
            return {...newP,x,y,cx:x,cy:y,span,trackId:prev?prev.trackId:(this._trackSeq=(this._trackSeq||0)+1),
              flashUntil:prev?.flashUntil||0,hitProgress:prev?.hitProgress||0};
          });
        }else{this.persistedPalms=[];}
        this.detectedPalms = this.persistedPalms;
      } catch (e) {
        this._detectErrors = (this._detectErrors || 0) + 1;
        if(this._detectErrors >= 3){
          this.modelReady=false;
          try{this.handLandmarker?.close();}catch(_){}
          this.handLandmarker=null;
          if(this.delegate === "GPU"){this.forceCPU=true;this.initHandModel();}
          else{this._runtimeFailed=true;this.modelError="Sensor berhenti memproses. Tekan Hubungkan Kamera atau tutup aplikasi lain.";}
        }
        this.detectedPalms = this.persistedPalms.filter(p => (nowMs - p.lastSeen) <= this.palmPersistenceMs);
      }
    }

    this.persistedPalms = this.persistedPalms.filter(p => nowMs - p.lastSeen <= this.palmPersistenceMs);
    this.detectedPalms = this.persistedPalms;
    return this.detectedPalms;
  }

  circleIntersectsRect(cx, cy, radius, rect) {
    const closestX = Math.max(rect.left, Math.min(cx, rect.right));
    const closestY = Math.max(rect.top, Math.min(cy, rect.bottom));
    const dist = Math.hypot(cx - closestX, cy - closestY);
    return { hit: dist <= radius, dist };
  }

  analyzeZones(zoneRectsByPlayer) {
    const palms = this.detectPalmsInFrame();
    const result = {
      cameraActive: this.cameraReady && this.video.readyState >= 2,
      modelReady: this.modelReady,
      palmCount: palms.length,
      players: {}
    };

    if (!result.cameraActive || !result.modelReady) return result;

    const box = this.getVideoDisplayBox();
    const isDuel = Object.keys(zoneRectsByPlayer).length === 2;

    for (const [playerKey, zones] of Object.entries(zoneRectsByPlayer)) {
      const pIdx = Number(playerKey);
      const playerPalms = palms.filter(palm => {
        if (!isDuel || isNaN(pIdx)) return true;
        if (pIdx === 0) return palm.x < box.arenaCenterX;
        return palm.x >= box.arenaCenterX;
      });

      const scores = new Array(zones.length).fill(0);
      let bestZoneIdx = -1;
      let bestZoneDist = Infinity;

      for (let z = 0; z < zones.length; z++) {
        const rect = zones[z];
        const rectCenterX = (rect.left + rect.right) / 2;
        const rectCenterY = (rect.top + rect.bottom) / 2;

        for (const palm of playerPalms) {
          const circleCheck = this.circleIntersectsRect(palm.x, palm.y, palm.radius + 32, rect);
          let isHit = circleCheck.hit;

          if (!isHit && palm.landmarks) {
            const keyIndices = [0, 4, 5, 8, 9, 12, 13, 16, 17, 20];
            for (const kIdx of keyIndices) {
              const pt = palm.landmarks[kIdx];
              if (
                pt &&
                pt.x >= rect.left - 32 &&
                pt.x <= rect.right + 32 &&
                pt.y >= rect.top - 32 &&
                pt.y <= rect.bottom + 32
              ) {
                isHit = true;
                break;
              }
            }
          }

          if (isHit) {
            const distToBubbleCenter = Math.hypot(palm.x - rectCenterX, palm.y - rectCenterY);
            if (distToBubbleCenter < bestZoneDist) {
              bestZoneDist = distToBubbleCenter;
              bestZoneIdx = z;
            }
          }
        }
      }

      if (bestZoneIdx !== -1) {
        scores[bestZoneIdx] = 1.0;
      }

      result.players[playerKey] = {
        scores,
        palmDetected: playerPalms.length > 0,
        globalSpike: false
      };
    }

    return result;
  }

  spawnShot(x0, y0, x1, y1, correct = true) {
    (this.shots = this.shots || []).push({ x0, y0, x1, y1, correct, t0: performance.now() });
  }

  spawnImpact(x, y, correct) {
    const cols = correct ? ["#FDE047", "#4ADE80", "#FFFFFF", "#22D3EE"] : ["#F87171", "#FCA5A5", "#9CA3AF"];
    const n = correct ? 22 : 9;
    const sparks = [];
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, sp = (correct ? 2.5 : 1.5) + Math.random() * (correct ? 5 : 3);
      sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1, life: 1, size: 10 + Math.random() * 10, color: cols[i % cols.length] });
    }
    (this.impacts = this.impacts || []).push({ x, y, correct, t0: performance.now(), sparks });
  }

  spawnParticles(x, y, color = "#FFB300") {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    if (this.particles.length > 40) return;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 4;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0, color });
    }
  }

  renderOverlay() {
    const arenaRect = this.canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(arenaRect.width));
    const targetH = Math.max(1, Math.round(arenaRect.height));
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-arenaRect.left, -arenaRect.top);

    const nowT = performance.now();
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]
    ];
    for (const palm of this.detectedPalms) {
      const lm = palm.landmarks;
      if (!lm || nowT - palm.lastSeen > this.palmPersistenceMs) continue;
      this.ctx.save();
      this.ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
      this.ctx.lineWidth = 2;
      for (const [a, b] of connections) {
        this.ctx.beginPath(); this.ctx.moveTo(lm[a].x, lm[a].y); this.ctx.lineTo(lm[b].x, lm[b].y); this.ctx.stroke();
      }
      this.ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < lm.length; i++) {
        this.ctx.beginPath(); this.ctx.arc(lm[i].x, lm[i].y, 2.5, 0, Math.PI * 2); this.ctx.fill();
      }
      const locked = nowT < palm.flashUntil, prog = palm.hitProgress || 0;
      this.ctx.strokeStyle = locked ? "#4ADE80" : "#FBBF24";
      this.ctx.lineWidth = 4;
      this.ctx.beginPath(); this.ctx.arc(palm.cx, palm.cy, 18, 0, Math.PI * 2); this.ctx.stroke();
      if (prog > 0) {
        this.ctx.lineWidth = 5;
        this.ctx.beginPath(); this.ctx.arc(palm.cx, palm.cy, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, prog)); this.ctx.stroke();
      }
      this.ctx.fillStyle = this.ctx.strokeStyle;
      this.ctx.font = "bold 18px sans-serif";this.ctx.fillText(locked?"PUKUL!":"TELAPAK",palm.cx+24,palm.cy-16);
      this.ctx.beginPath(); this.ctx.arc(palm.cx, palm.cy, 4, 0, Math.PI * 2); this.ctx.fill();
      this.ctx.restore();
    }

    if (this.shots && this.shots.length) {
      const alive = [];
      for (const sh of this.shots) {
        if (nowT - sh.t0 >= 260) this.spawnImpact(sh.x1, sh.y1, sh.correct); else alive.push(sh);
      }
      this.shots = alive;
      for (const sh of this.shots) {
        const t = (nowT - sh.t0) / 260;
        const px = sh.x0 + (sh.x1 - sh.x0) * t, py = sh.y0 + (sh.y1 - sh.y0) * t;
        const tx = sh.x0 + (sh.x1 - sh.x0) * Math.max(0, t - 0.2), ty = sh.y0 + (sh.y1 - sh.y0) * Math.max(0, t - 0.2);
        this.ctx.strokeStyle = "rgba(251,146,60,0.7)"; this.ctx.lineWidth = 4;
        this.ctx.beginPath(); this.ctx.moveTo(tx, ty); this.ctx.lineTo(px, py); this.ctx.stroke();
        this.ctx.fillStyle = "#FDBA74";
        this.ctx.beginPath(); this.ctx.arc(px, py, 7, 0, Math.PI * 2); this.ctx.fill();
      }
    }

    if (this.impacts && this.impacts.length) {
      const DUR = 750;
      this.impacts = this.impacts.filter(im => nowT - im.t0 < DUR);
      for (const im of this.impacts) {
        const t = (nowT - im.t0) / DUR, e = 1 - Math.pow(1 - t, 3);
        const main = im.correct ? "#4ADE80" : "#F87171";
        this.ctx.save();
        this.ctx.strokeStyle = main; this.ctx.globalAlpha = 1 - t; this.ctx.lineWidth = 7 * (1 - t) + 1;
        this.ctx.beginPath(); this.ctx.arc(im.x, im.y, 14 + 90 * e, 0, Math.PI * 2); this.ctx.stroke();
        if (im.correct && t > 0.12) {
          const t2 = (t - 0.12) / 0.88, e2 = 1 - Math.pow(1 - t2, 3);
          this.ctx.strokeStyle = "#FDE047"; this.ctx.globalAlpha = 1 - t2; this.ctx.lineWidth = 4 * (1 - t2) + 1;
          this.ctx.beginPath(); this.ctx.arc(im.x, im.y, 10 + 62 * e2, 0, Math.PI * 2); this.ctx.stroke();
        }
        this.ctx.globalAlpha = Math.max(0, 0.45 * (1 - t * 3));
        if (this.ctx.globalAlpha > 0) {
          this.ctx.fillStyle = main;
          this.ctx.beginPath(); this.ctx.arc(im.x, im.y, 26, 0, Math.PI * 2); this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
        for (const sp of im.sparks) {
          sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.12; sp.vx *= 0.97; sp.life = Math.max(0, 1 - t * 1.15);
          this.ctx.globalAlpha = sp.life; this.ctx.fillStyle = sp.color;
          this.ctx.font = `${sp.size}px sans-serif`;
          this.ctx.fillText(im.correct ? "✦" : "•", sp.x, sp.y);
        }
        this.ctx.globalAlpha = Math.max(0, 1 - t * 1.2);
        this.ctx.font = `${30 + 14 * e}px sans-serif`;
        this.ctx.fillText(im.correct ? "⭐" : "💨", im.x, im.y - 22 - 46 * e);
        this.ctx.restore();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }
}

/* ============================================================================
   4. ENGINE PERMAINAN UTAMA (PENJAGA RIMBA: TARGET EKOSISTEM)
   ============================================================================ */
class EcosystemQuadrantGame {
  constructor() {
    this.audio = new GameAudioManager();
    this.detector = new PalmOnlyDetector(
      document.getElementById("webcam-video"),
      document.getElementById("motion-canvas")
    );

    this.mode = "solo_com";
    this.difficulty = "K1";
    this.posture = "seated";
    this.sessionDurationSec = 600;
    this.sessionTimeLeft = 600;
    this.lastCountdownBeepSec = -1;
    this.questionsPerSession = 25;

    this.state = "COVER";
    this.players = [];
    this.comState = null;
    this.tourneyState = null;
    this.sessionHistory = [];

    this.dwellDurationMs = 360;
    this.hitsToBreak = 3;
    this.hitCooldownMs = 350;
    this.hitDecayMs = 1500;
    this.practiceHits = 0;
    this.practiceTracker = new HandStrikeTracker();
    this.practiceLastHitAt = 0;
    this.dwellHoldGraceMs = 500;
    this.cooldownMs = 800;
    this.readPhaseMs = 1200;

    this.pointerMap = new Map();
    this.practiceDwell = 0;
    this.practiceLastMotionAt = 0;
    this.practiceAutoTimer = null;
    this.lastFrameTime = performance.now();

    this.bindEvents();
    requestAnimationFrame((t) => this.mainLoop(t));
  }

  get gradeNum() { return Number(String(this.difficulty).replace("K", "")) || 1; }
  get gradeLabel() { const g = GRADE_INFO["K" + this.gradeNum]; return `${g.label} (${g.range})`; }
  get qTime() { return [20, 30, 40, 50, 60, 75][this.gradeNum - 1]; }

  buildSessionQuestions(diff, count) {
    const g = Number(String(diff).replace("K", "")) || 1;
    const seen = new Set(), out = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 30) {
      const q = genQuestion(g);
      if (seen.has(q.question)) continue;
      seen.add(q.question);
      const opts = q.options.map((text, i) => ({ text, isCorrect: i === 0 })).sort(() => Math.random() - 0.5);
      out.push({ id: q.id, difficulty: q.difficulty, question: q.question,
        options: opts.map(o => o.text), correctIndex: opts.findIndex(o => o.isCorrect), explanation: q.explanation });
    }
    return out;
  }

  bindEvents() {
    const modeSelect=document.getElementById("select-sensor-mode");
    if(/Android/i.test(navigator.userAgent))modeSelect.value="CPU";
    modeSelect.addEventListener("change",async()=>{
      if(this.detector._modelPromise)await this.detector._modelPromise;
      try{this.detector.handLandmarker?.close();}catch(_){}
      this.detector.handLandmarker=null;this.detector.modelReady=false;
      this.detector.forceCPU=modeSelect.value==="CPU";
      this.detector._runtimeFailed=false;this.detector.detectedPalms=[];this.detector.persistedPalms=[];
      await this.detector.initHandModel();
    });
    document.getElementById("btn-camera-live").addEventListener("click",()=>this.requestCameraAndUpdateUI());
    document.getElementById("select-camera").addEventListener("change",()=>this.requestCameraAndUpdateUI());
    document.getElementById("btn-toggle-audio").addEventListener("click", () => {
      const muted = this.audio.toggleMute();
      document.getElementById("audio-icon").textContent = muted ? "🔇" : "🔊";
      document.getElementById("audio-label").textContent = muted ? "Suara Mati" : "Suara Aktif";
      if (!muted && this.state === "COVER") this.audio.playMusic("menu_theme");
    });

    document.getElementById("btn-fullscreen").addEventListener("click", () => {
      this.audio.playSfx("click");
      if (!document.fullscreenElement) {
        GameFullscreen.enter();
      } else {
        GameFullscreen.wanted=false;document.exitFullscreen?.().catch(() => {});
      }
    });

    document.getElementById("btn-start-main").addEventListener("click", async () => {
      this.audio.initContext();
      this.audio.playSfx("click");
      this.audio.playMusic("menu_theme");

      this.mode = document.getElementById("select-mode")?.value || "solo_com";
      this.difficulty = document.getElementById("select-diff")?.value || "K1";
      this.posture = document.getElementById("select-posture")?.value || "seated";
      const rawDur = document.getElementById("select-duration")?.value;
      const durVal = rawDur !== undefined ? Number(rawDur) : 600;
      this.sessionDurationSec = !isNaN(durVal) && durVal >= 0 ? durVal : 600;

      this.openCalibrationScreen();
    });

    document.getElementById("btn-calib-back").addEventListener("click", () => {
      this.audio.playSfx("click");
      this.clearPracticeTimer();
      this.showScreen("cover-screen");
      this.state = "COVER";
    });

    document.getElementById("btn-retry-cam").addEventListener("click", () => {
      this.audio.playSfx("click");
      this.requestCameraAndUpdateUI();
    });

    document.getElementById("btn-skip-practice").addEventListener("click", () => {
      GameFullscreen.enter();
      this.audio.playSfx("click");
      this.clearPracticeTimer();
      this.startConfiguredSession();
    });


    document.getElementById("btn-pause-game").addEventListener("click", () => this.pauseGame());
    document.getElementById("btn-finish-game").addEventListener("click", () => {
      this.audio.playSfx("click");
      this.finishSessionAndShowResults();
    });
    document.getElementById("btn-resume-game").addEventListener("click", () => this.resumeGame());
    document.getElementById("btn-end-from-pause").addEventListener("click", () => {
      this.audio.playSfx("click");
      document.getElementById("pause-modal").classList.add("hidden");
      this.finishSessionAndShowResults();
    });
    document.getElementById("btn-restart-session").addEventListener("click", () => {
      document.getElementById("pause-modal").classList.add("hidden");
      this.startConfiguredSession();
    });
    document.getElementById("btn-quit-to-cover").addEventListener("click", () => {
      document.getElementById("pause-modal").classList.add("hidden");
      this.state = "COVER";
      this.audio.playMusic("menu_theme");
      this.showScreen("cover-screen");
    });

    document.getElementById("btn-switch-posture-live").addEventListener("click", () => {
      this.audio.playSfx("click");
      this.posture = this.posture === "seated" ? "standing" : "seated";
      this.applyPostureClasses();
    });

    document.getElementById("btn-play-again").addEventListener("click", () => {
      this.audio.playSfx("click");
      this.startConfiguredSession();
    });
    document.getElementById("btn-result-home").addEventListener("click", () => {
      this.audio.playSfx("click");
      this.state = "COVER";
      this.audio.playMusic("menu_theme");
      this.showScreen("cover-screen");
    });

    document.getElementById("btn-open-guide").addEventListener("click", () => {
      this.audio.playSfx("click");
      document.getElementById("guide-modal").classList.remove("hidden");
    });
    document.getElementById("btn-close-guide").addEventListener("click", () => {
      document.getElementById("guide-modal").classList.add("hidden");
    });

    window.addEventListener("keydown", (e) => {
      if (this.state !== "PLAYING") return;
      const key = e.key.toUpperCase();
      const p1Map = { "Q": 0, "W": 1, "A": 2, "S": 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      const p2Map = { "I": 0, "O": 1, "K": 2, "L": 3 };

      if (p1Map[key] !== undefined && this.players[0]) {
        this.submitAnswer(0, p1Map[key], true);
      }
      if (p2Map[key] !== undefined) {
        if (this.players[1]) {
          this.submitAnswer(1, p2Map[key], true);
        } else if (this.players[0]) {
          this.submitAnswer(0, p2Map[key], true);
        }
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.audio.stopMusic();
        if (this.state === "PLAYING") this.pauseGame();
      } else if (!this.audio.muted && this.state === "COVER") {
        this.audio.playMusic("menu_theme");
      }
    });
  }

  showScreen(screenId) {
 const arena=document.getElementById("arena-container");
 arena.classList.remove("animation-paused");
 arena.classList.toggle("camera-mode",screenId==="gameplay-screen"||screenId==="calibration-screen");
    ["cover-screen", "calibration-screen", "gameplay-screen", "results-screen"].forEach(id => {
      const el = document.getElementById(id);
      if (id === screenId) el.classList.remove("hidden");
      else el.classList.add("hidden");
    });
  }

  async openCalibrationScreen() {
    this.state = "CALIB";
    this.showScreen("calibration-screen");
    this.practiceHits=0;this.practiceLastHitAt=-Infinity;this.practiceTracker.reset();
    document.getElementById("practice-progress").style.width = "0%";

    const modeTitles = {
      solo_com: "Kalibrasi Solo vs COM (Robo Arka)",
      pvp_duel: "Kalibrasi Duel 2 Pemain Serentak (Kiri P1 & Kanan P2)",
      coop_com: "Kalibrasi 2 Pemain Kooperatif vs COM",
      tourney_4p: "Kalibrasi Lomba 4 Pemain (Giliran Setara)"
    };
    document.getElementById("calib-title").textContent = modeTitles[this.mode] || "Kalibrasi Kamera";
    await this.requestCameraAndUpdateUI();
  }

  clearPracticeTimer() {
    if (this.practiceAutoTimer) {
      clearInterval(this.practiceAutoTimer);
      this.practiceAutoTimer = null;
    }
  }

  async requestCameraAndUpdateUI() {
    const pill = document.getElementById("camera-status-pill");
    pill.textContent = "📷 Memuat Kamera & Sensor Telapak Tangan...";
    pill.className = "px-3 py-1.5 rounded-full text-xs font-bold bg-amber-700 text-white";

    if(document.fullscreenElement)GameFullscreen.wanted=true;
    const res = await this.detector.startCamera();
    GameFullscreen.update();
    if (res.ok && res.modelReady) {
      pill.textContent = "✅ Sensor Telapak Tangan Aktif (Wajah/Badan Diabaikan)";
      pill.className = "px-3 py-1.5 rounded-full text-xs font-bold bg-green-700 text-white";
    } else if (res.ok && !res.modelReady) {
      pill.textContent = "⚠️ Kamera Aktif (Model Tangan Offline — Gunakan Klik/Sentuh)";
      pill.className = "px-3 py-1.5 rounded-full text-xs font-bold bg-amber-700 text-white";
    } else {
      pill.textContent = res.error || "Kamera belum tersedia — gunakan sentuh/keyboard.";
      pill.className = "px-3 py-1.5 rounded-full text-xs font-bold bg-rose-700 text-white";
    }
  }

  startConfiguredSession() {
    this.sessionHistory = [];
    this.pointerMap.clear();
    this.sessionTimeLeft = this.sessionDurationSec;
    this.lastCountdownBeepSec = -1;

    if (this.mode === "tourney_4p") {
      this.tourneyState = {
        currentPlayerIdx: 0,
        scores: [0, 0, 0, 0],
        corrects: [0, 0, 0, 0],
        names: ["Pemain 1 (Raka)", "Pemain 2 (Arka)", "Pemain 3 (Sinta)", "Pemain 4 (Bima)"],
        sharedQuestions: this.buildSessionQuestions(this.difficulty, 25)
      };
      this.startSubRoundForTourney();
      return;
    }

    this.tourneyState = null;
    try { this.detector.handLandmarker?.setOptions({ numHands: 2 }); } catch (e) {}
    const baseQuestions = this.buildSessionQuestions(this.difficulty, 25);

    if (this.mode === "pvp_duel") {
      this.players = [
        this.createPlayerState(0, "P1 • Raka Angka", baseQuestions),
        this.createPlayerState(1, "P2 • Robo Arka", baseQuestions)
      ];
      try { this.detector.handLandmarker?.setOptions({ numHands: 4 }); } catch (e) {}
      this.comState = null;
    } else if (this.mode === "solo_com" || this.mode === "coop_com") {
      const label = this.mode === "coop_com" ? "Tim Raka & Arka (2P)" : "P1 • Raka Angka";
      this.players = [
        this.createPlayerState(0, label, baseQuestions)
      ];
      const comAccMap = { K1: 0.85, K2: 0.80, K3: 0.75, K4: 0.70, K5: 0.65, K6: 0.60 };
      this.comState = {
        name: "COM • Robot Pintar",
        score: 0,
        qIndex: 0,
        correctCount: 0,
        accuracy: comAccMap[this.difficulty] || 0.72,
        nextActionAt: performance.now() + 6500,
        statusText: "Menganalisis..."
      };
    }

    this.launchGameplayUI();
  }

  startSubRoundForTourney() {
    const t = this.tourneyState;
    const pName = t.names[t.currentPlayerIdx];
    this.sessionTimeLeft = this.sessionDurationSec;
    this.lastCountdownBeepSec = -1;
    const roundQuestions = t.sharedQuestions;
    this.players = [
      this.createPlayerState(0, pName, roundQuestions)
    ];
    this.comState = null;
    this.launchGameplayUI();
  }

  createPlayerState(idx, name, questions) {
    const now = performance.now();
    const anchorSeeds = [
      { ax: 0.22, ay: 0.26, vx: 0.045, vy: 0.035, phase: 0.0 },
      { ax: 0.78, ay: 0.26, vx: -0.042, vy: 0.038, phase: 1.6 },
      { ax: 0.22, ay: 0.74, vx: 0.038, vy: -0.042, phase: 3.1 },
      { ax: 0.78, ay: 0.74, vx: -0.044, vy: -0.036, phase: 4.7 }
    ];
    return {
      idx,
      name,
      questions,
      questionIndex: 0,
      answeredCount: 0,
      score: 0,
      correctCount: 0,
      streak: 0,
      finished: false,
      dwellTarget: -1,
      dwellProgress: 0,
      lastZoneMotionAt: [0, 0, 0, 0],
      hits: [0, 0, 0, 0],
      lastHitAt: [0, 0, 0, 0],
      aimTarget: -1, aimMs: 0, locked: false,
      strikeTracker:new HandStrikeTracker(),
      cooldownUntil: now + 900,
      readPhaseUntil: now + this.readPhaseMs,
      questionTimeLeft: this.qTime,
      feedbackBanner: null,
      feedbackUntil: 0,
      bubbles: anchorSeeds.map((seed, bIdx) => ({
        idx: bIdx, x: seed.ax, y: seed.ay, vx: seed.vx, vy: seed.vy, phase: seed.phase
      }))
    };
  }

  formatDurationMMSS(seconds) {
    if (this.sessionDurationSec === 0) {
      return "♾️ TANPA WAKTU";
    }
    const clamped = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  getDurationLabelText() {
    if (this.sessionDurationSec === 0) return "Tanpa Batas Waktu";
    return `${Math.round(this.sessionDurationSec / 60)} Menit`;
  }

  launchGameplayUI() {
    this.state = "PLAYING"; document.getElementById("arena-container").classList.remove("animation-paused");
    this.showScreen("gameplay-screen");
    this.audio.playMusic("gameplay_theme");

    const playfield = document.getElementById("arena-playfield");
    playfield.innerHTML = "";

    const isDuel = this.players.length === 2;
    playfield.className = isDuel
      ? "relative flex-1 w-full h-full grid grid-cols-2 divide-x-4 divide-amber-400/70 overflow-hidden"
      : "relative flex-1 w-full h-full flex overflow-hidden";

    this.players.forEach((p, idx) => {
      const vp = document.createElement("div");
      vp.id = `viewport-p${idx}`;
      vp.className = "relative w-full h-full flex flex-col justify-between p-2 md:p-4 pointer-events-none";

      vp.innerHTML = `
        <div class="w-full max-w-4xl mx-auto bg-slate-950/90 border-2 ${idx === 0 ? 'border-emerald-400' : 'border-amber-400'} rounded-2xl px-4 py-2.5 shadow-2xl z-10">
          <div class="flex items-center justify-between text-xs md:text-sm font-extrabold mb-1">
            <span id="vp-qmeta-p${idx}" class="text-amber-300 uppercase">${p.name} • SOAL 1/${p.questions.length}</span>
            <div class="flex items-center gap-2">
              <span id="vp-timer-p${idx}" class="font-mono text-base md:text-lg font-black text-emerald-300">30.0s</span>
            </div>
          </div>
          <p id="vp-qtext-p${idx}" class="text-sm sm:text-base md:text-lg font-extrabold text-white leading-snug">
            Memuat soal hitung...
          </p>
        </div>

        <div id="quad-wrapper-p${idx}" class="relative flex-1 w-full my-1.5 overflow-hidden">
          <div class="face-safe-zone absolute inset-0 m-auto w-28 h-28 md:w-44 md:h-44 flex flex-col items-center justify-center text-center p-2 z-0">
            <span class="arena-character character-motion ${idx === 0 ? 'raka' : 'arka'}" data-character="${idx === 0 ? 'raka' : 'arka'}" aria-hidden="true"><img class="character-art" src="aset/karakter/${idx === 0 ? 'raka' : 'robo-arka'}.png" alt=""></span><span class="face-zone-label text-[10px] font-bold text-white/40 uppercase">Zona Wajah Aman</span>
            <span id="vp-feedback-p${idx}" class="mt-1 hidden px-3 py-1.5 rounded-xl text-xs md:text-sm font-black shadow-lg z-30"></span>
          </div>

          ${[0, 1, 2, 3].map(qIdx => {
            const labels = ["A", "B", "C", "D"];
            const keyHintsP1 = ["Q", "W", "A", "S"];
            const keyHintsP2 = ["I", "O", "K", "L"];
            const keyHint = idx === 0 ? keyHintsP1[qIdx] : keyHintsP2[qIdx];
            const sizeClasses = isDuel
              ? "w-[150px] h-[150px] md:w-[172px] md:h-[172px]"
              : "w-[172px] h-[172px] md:w-[200px] md:h-[200px]";
            return `
              <div id="quad-p${idx}-${qIdx}" data-player="${idx}" data-quad="${qIdx}" tabindex="0" role="button"
                   data-dmg="0" class="floating-bubble ${sizeClasses} flex flex-col items-center justify-center z-10 select-none">
                <svg class="shield-bg reticle" viewBox="0 0 100 100" aria-hidden="true">
                  <circle class="fillc" cx="50" cy="50" r="44"/>
                  <circle class="ring" cx="50" cy="50" r="44"/>
                  <circle class="ring2" cx="50" cy="50" r="33"/>
                  <path class="ticks" d="M50 2 V15 M50 85 V98 M2 50 H15 M85 50 H98"/>
                </svg>
                <span class="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow">${labels[qIdx]}</span>
                <div id="quad-text-p${idx}-${qIdx}" class="relative z-10 reticle-text flex items-center justify-center my-0.5 text-lg md:text-xl font-extrabold text-white leading-tight text-center px-1 max-w-[70%]">
                  Opsi ${labels[qIdx]}
                </div>
                <div class="relative z-10 w-[48%] h-2 bg-black/50 rounded-full overflow-hidden border border-white/30">
                  <div id="quad-bar-p${idx}-${qIdx}" class="h-full bg-amber-400 transition-all duration-75" style="width: 0%;"></div>
                </div>
                <span id="quad-hits-p${idx}-${qIdx}" class="relative z-10 mt-0.5 text-xs font-bold text-amber-200 reticle-text">0 / 3 pukulan</span><span class="relative z-10 text-[9px] text-white/70">[${keyHint}]</span>
              </div>
            `;
          }).join("")}
        </div>

        ${(idx === 0 && this.comState) ? `
          <div class="w-full max-w-md mx-auto bg-amber-950/85 border border-amber-400/60 rounded-xl px-3 py-1 flex items-center justify-between gap-2 text-xs z-10">
            <span class="font-extrabold text-amber-300">⚔️ Target Virtual COM:</span>
            <span id="com-live-status" class="text-amber-100 truncate">Menyiapkan strategi...</span>
          </div>
        ` : ""}
      `;

      playfield.appendChild(vp);
    });

    this.applyPostureClasses();
    this.bindQuadrantPointerEvents();
    this.refreshAllPlayerHUDs();
    this.updateFloatingBubblesPhysics(0.016, performance.now());
  }

  applyPostureClasses() {
    const footerHint = document.getElementById("footer-control-hint");
    if (footerHint) {
      footerHint.textContent = this.posture === "seated"
        ? "🪑 Mode Duduk: ayun tangan ke jawaban 3 kali. Tarik keluar setelah tiap pukulan."
        : "🧍 Mode Berdiri: ayun tangan ke jawaban 3 kali. Tarik keluar setelah tiap pukulan.";
    }
  }

  updateFloatingBubblesPhysics(dt, now) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSeated = this.posture === "seated";
    const anchors = isSeated
      ? [{ x: 0.25, y: 0.26 }, { x: 0.75, y: 0.26 }, { x: 0.25, y: 0.74 }, { x: 0.75, y: 0.74 }]
      : [{ x: 0.20, y: 0.24 }, { x: 0.80, y: 0.24 }, { x: 0.20, y: 0.76 }, { x: 0.80, y: 0.76 }];

    const orbitRadiusX = isSeated ? 0.022 : 0.032;
    const orbitRadiusY = isSeated ? 0.024 : 0.035;

    this.players.forEach((p, pIdx) => {
      const wrapper = document.getElementById(`quad-wrapper-p${pIdx}`);
      if (!wrapper || !p.bubbles) return;
      const wRect = wrapper.getBoundingClientRect();
      if (wRect.width < 20 || wRect.height < 20) return;

      const quadrantBounds = [
        { minX: 0.02, maxX: 0.45, minY: 0.02, maxY: 0.45 },
        { minX: 0.55, maxX: 0.98, minY: 0.02, maxY: 0.45 },
        { minX: 0.02, maxX: 0.45, minY: 0.55, maxY: 0.98 },
        { minX: 0.55, maxX: 0.98, minY: 0.55, maxY: 0.98 }
      ];

      p.bubbles.forEach((b, qIdx) => {
        const el = document.getElementById(`quad-p${pIdx}-${qIdx}`);
        if (!el) return;

        const bWidth = el.offsetWidth || 160;
        const bHeight = el.offsetHeight || 90;
        const isDwellingThis = p.hits[qIdx] > 0;
        const speedFactor = prefersReduced ? 0 : (isDwellingThis ? 0.0 : 0.55);

        b.phase += dt * 0.95 * speedFactor;
        const anchor = anchors[qIdx];
        const targetX = anchor.x + Math.cos(b.phase + qIdx) * orbitRadiusX;
        const targetY = anchor.y + Math.sin(b.phase * 1.15 + qIdx) * orbitRadiusY;

        if (!isDwellingThis) {
          b.x += (targetX - b.x) * Math.min(1, dt * 4);
          b.y += (targetY - b.y) * Math.min(1, dt * 4);
        }

        const halfWRatio = Math.min(0.21, (bWidth / 2 + 6) / wRect.width);
        const halfHRatio = Math.min(0.21, (bHeight / 2 + 6) / wRect.height);
        const qb = quadrantBounds[qIdx];

        const minAllowedX = Math.max(halfWRatio, qb.minX + halfWRatio * 0.65);
        const maxAllowedX = Math.min(1 - halfWRatio, qb.maxX - halfWRatio * 0.65);
        const minAllowedY = Math.max(halfHRatio, qb.minY + halfHRatio * 0.65);
        const maxAllowedY = Math.min(1 - halfHRatio, qb.maxY - halfHRatio * 0.65);

        let clampedX = Math.max(minAllowedX, Math.min(maxAllowedX, b.x));
        let clampedY = Math.max(minAllowedY, Math.min(maxAllowedY, b.y));

        if(this.detector.cameraReady){
          const cb=this.detector.getVideoDisplayBox();
          const left=Math.max(minAllowedX,(cb.offsetX-wRect.left+bWidth/2)/wRect.width);
          const right=Math.min(maxAllowedX,(cb.offsetX+cb.renderW-wRect.left-bWidth/2)/wRect.width);
          const top=Math.max(minAllowedY,(cb.offsetY-wRect.top+bHeight/2)/wRect.height);
          const bottom=Math.min(maxAllowedY,(cb.offsetY+cb.renderH-wRect.top-bHeight/2)/wRect.height);
          if(left<=right)clampedX=Math.max(left,Math.min(right,clampedX));
          if(top<=bottom)clampedY=Math.max(top,Math.min(bottom,clampedY));
        }
        const px = clampedX * wRect.width - bWidth / 2;
        const py = clampedY * wRect.height - bHeight / 2;
        const scale = 1.0;

        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${scale})`;
      });
    });
  }

  bindQuadrantPointerEvents() {
    document.querySelectorAll(".floating-bubble[data-player]").forEach(card => {
      const pIdx = Number(card.dataset.player);
      const qIdx = Number(card.dataset.quad);

      card.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.pointerMap.set(e.pointerId, { pIdx, qIdx });
        this.submitAnswer(pIdx, qIdx, true);
      });

      const cleanup = (e) => { this.pointerMap.delete(e.pointerId); };
      card.addEventListener("pointerup", cleanup);
      card.addEventListener("pointercancel", cleanup);
    });
  }

  refreshAllPlayerHUDs() {
    const p1 = this.players[0];
    if (p1) {
      document.getElementById("hud-p1-name").textContent = p1.name;
      document.getElementById("hud-p1-score").textContent = `${p1.score} Poin`;
      document.getElementById("hud-p1-qcount").textContent =
        `Benar: ${p1.correctCount} | Soal #${p1.answeredCount + 1}`;
    }

    const sessionTimerEl = document.getElementById("hud-session-timer");
    if (sessionTimerEl) {
      sessionTimerEl.textContent = this.formatDurationMMSS(this.sessionTimeLeft);
    }

    const p2Box = document.getElementById("hud-p2-box");
    if (this.players[1]) {
      p2Box.classList.remove("hidden");
      document.getElementById("hud-p2-name").textContent = this.players[1].name;
      document.getElementById("hud-p2-score").textContent = `${this.players[1].score} Poin`;
    } else if (this.comState) {
      p2Box.classList.remove("hidden");
      document.getElementById("hud-p2-name").textContent = this.comState.name;
      document.getElementById("hud-p2-score").textContent = `${this.comState.score} Poin`;
    } else if (this.tourneyState) {
      p2Box.classList.remove("hidden");
      document.getElementById("hud-p2-name").textContent = `Giliran ${this.tourneyState.currentPlayerIdx + 1}/4`;
      document.getElementById("hud-p2-score").textContent = "Lomba 4P";
    } else {
      p2Box.classList.add("hidden");
    }

    this.players.forEach((p, idx) => this.renderPlayerQuestion(idx));
  }

  renderPlayerQuestion(idx) {
    const p = this.players[idx];
    if (!p) return;

    const metaEl = document.getElementById(`vp-qmeta-p${idx}`);
    const qTextEl = document.getElementById(`vp-qtext-p${idx}`);

    if (p.finished) {
      if (metaEl) metaEl.textContent = `${p.name} • WAKTU HABIS!`;
      if (qTextEl) qTextEl.textContent = `🎉 Misi selesai! Total Skor: ${p.score} Poin (${p.correctCount} Benar)`;
      for (let q = 0; q < 4; q++) {
        const optEl = document.getElementById(`quad-text-p${idx}-${q}`);
        if (optEl) optEl.textContent = "✓ Selesai";
      }
      return;
    }

    const currentQ = p.questions[p.questionIndex];
    if (!currentQ) return;

    const streakTag = p.streak >= 2 ? ` • 🔥Beruntun x${p.streak}` : "";
    if (metaEl) metaEl.textContent = `${p.name} • SOAL #${p.answeredCount + 1} (${currentQ.id}) • Benar: ${p.correctCount}${streakTag}`;
    if (qTextEl) qTextEl.textContent = currentQ.question;

    for (let q = 0; q < 4; q++) {
      const optEl = document.getElementById(`quad-text-p${idx}-${q}`);
      if (optEl) optEl.textContent = currentQ.options[q];
    }
  }

  fireAt(pIdx, qIdx, cur) {
    const el = document.getElementById(`quad-p${pIdx}-${qIdx}`);
    const pl = this.players[pIdx];
    const cq = pl && pl.questions[pl.questionIndex];
    const correct = !!cq && qIdx === cq.correctIndex;
    if (el && cur) {
      const r = el.getBoundingClientRect();
      this.detector.spawnShot(cur.x, cur.y, r.left + r.width / 2, r.top + r.height / 2, correct);
      el.classList.remove("shield-hit"); void el.offsetWidth; el.classList.add("shield-hit");
    }
    this.submitAnswer(pIdx, qIdx, false);
  }

  registerHit(pIdx, qIdx, x, y) {
    const p = this.players[pIdx];
    if (!p || p.finished || this.state !== "PLAYING") return;
    const now = performance.now();
    if (now < p.readPhaseUntil || now < p.cooldownUntil) return;
    if (now - p.lastHitAt[qIdx] < this.hitCooldownMs) return;
    p.lastHitAt[qIdx] = now;
    p.hits[qIdx]++;
    const el = document.getElementById(`quad-p${pIdx}-${qIdx}`);
    if (el) {
      el.classList.remove("shield-hit"); void el.offsetWidth; el.classList.add("shield-hit");
      const r = el.getBoundingClientRect();
      this.detector.spawnParticles(x ?? r.left + r.width / 2, y ?? r.top + r.height / 2, "#FDBA74");
    }
    this.audio.playTone(150 + p.hits[qIdx] * 60, 0.08, "sawtooth", 0.2);
    if (p.hits[qIdx] >= this.hitsToBreak) this.submitAnswer(pIdx, qIdx, false);
  }

  submitAnswer(playerIdx, quadIdx, isManualClick = false) {
    const p = this.players[playerIdx];
    if (!p || p.finished || this.state !== "PLAYING") return;

    const now = performance.now();
    if (!isManualClick && now < p.cooldownUntil) return;
    if (isManualClick && now < p.cooldownUntil - (this.cooldownMs - 250)) return;

    const currentQ = p.questions[p.questionIndex];
    if (!currentQ) return;

    const isCorrect = quadIdx === currentQ.correctIndex; window.AnimeCharacters?.react(playerIdx === 0 ? "raka" : "arka", isCorrect ? "cheer" : "oops");
    p.cooldownUntil = now + this.cooldownMs;
    p.dwellTarget = -1;
    p.dwellProgress = 0;
    p.lastZoneMotionAt = [0, 0, 0, 0];
    p.hits = [0, 0, 0, 0];
    p.aimTarget = -1; p.aimMs = 0; p.locked = false;
    p.strikeTracker.reset();
    p.answeredCount++;

    const cardEl = document.getElementById(`quad-p${playerIdx}-${quadIdx}`);
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      this.detector.spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, isCorrect ? "#4ADE80" : "#F87171");
    }

    if (isCorrect) {
      p.streak++;
      const speedBonus = Math.ceil(p.questionTimeLeft * 2);
      const streakBonus = Math.min(100, (p.streak - 1) * 20);
      const totalEarned = 100 + speedBonus + streakBonus;
      p.score += totalEarned;
      p.correctCount++;
      this.audio.playSfx("correct");
      const streakMsg = streakBonus > 0 ? ` (🔥Kombo +${streakBonus})` : "";
      this.showPlayerFeedback(playerIdx, `✅ BENAR! +${totalEarned}${streakMsg}`, "bg-green-600 text-white");
    } else {
      p.streak = 0;
      const labels = ["A", "B", "C", "D"];
      this.audio.playSfx("wrong");
      this.showPlayerFeedback(playerIdx, `❌ Kurang Tepat (Kunci: ${labels[currentQ.correctIndex]})`, "bg-rose-600 text-white");
    }

    this.sessionHistory.push({
      playerName: p.name,
      qId: currentQ.id,
      question: currentQ.question,
      chosen: currentQ.options[quadIdx] || "Waktu Soal Habis",
      correctAnswer: currentQ.options[currentQ.correctIndex],
      isCorrect,
      explanation: currentQ.explanation
    });

    p.questionIndex++;
    if (p.questionIndex >= p.questions.length) {
      const moreQuestions = this.buildSessionQuestions(this.difficulty, 25);
      p.questions.push(...moreQuestions);
    }

    p.readPhaseUntil = now + this.readPhaseMs;
    p.questionTimeLeft = this.qTime;
    this.refreshAllPlayerHUDs();
  }

  showPlayerFeedback(playerIdx, text, colorClasses) {
    const el = document.getElementById(`vp-feedback-p${playerIdx}`);
    if (!el) return;
    el.textContent = text;
    el.className = `mt-1 px-3 py-1.5 rounded-xl text-xs md:text-sm font-black shadow-lg ${colorClasses}`;
    const p = this.players[playerIdx];
    if (p) p.feedbackUntil = performance.now() + 1300;
  }

  checkSessionCompletion() {
    const allDone = this.players.every(p => p.finished);
    if (!allDone) return;

    if (this.tourneyState) {
      const t = this.tourneyState;
      t.scores[t.currentPlayerIdx] = this.players[0].score;
      t.corrects[t.currentPlayerIdx] = this.players[0].correctCount;
      t.currentPlayerIdx++;
      if (t.currentPlayerIdx < 4) {
        setTimeout(() => { this.startSubRoundForTourney(); }, 900);
        return;
      }
    }

    setTimeout(() => { this.finishSessionAndShowResults(); }, 600);
  }

  pauseGame() {
    if (this.state !== "PLAYING") return;
    this.state = "PAUSED"; document.getElementById("arena-container").classList.add("animation-paused");
    this.audio.stopMusic();
    document.getElementById("pause-modal").classList.remove("hidden");
  }

  resumeGame() {
    if (this.state !== "PAUSED") return;
    document.getElementById("pause-modal").classList.add("hidden");
    this.state = "PLAYING"; document.getElementById("arena-container").classList.remove("animation-paused");
    this.lastFrameTime = performance.now();
    this.audio.playMusic("gameplay_theme");
  }

  finishSessionAndShowResults() {
    this.state = "RESULTS";
    this.audio.stopMusic();
    this.showScreen("results-screen");

    const board = document.getElementById("result-scoreboard");
    board.innerHTML = "";
    const titleEl = document.getElementById("result-title");
    const subtitleEl = document.getElementById("result-subtitle");
    const durLabel = this.getDurationLabelText();
    if (subtitleEl) {
      subtitleEl.textContent = `Misi Durasi ${durLabel} • ${this.gradeLabel} selesai! Berikut perolehan poin dan pembahasan soal.`;
    }

    if (this.tourneyState) {
      const t = this.tourneyState;
      let maxScore = -1;
      let winnerName = "";
      t.scores.forEach((sc, idx) => {
        if (sc > maxScore) { maxScore = sc; winnerName = t.names[idx]; }
        board.innerHTML += `
          <div class="bg-emerald-900/80 border-2 border-emerald-400 rounded-2xl p-4 text-center">
            <div class="text-xs font-bold text-amber-200">${t.names[idx]}</div>
            <div class="text-3xl font-black text-white mt-1">${sc} Poin</div>
            <div class="text-xs text-emerald-200 mt-1">Jawaban Benar: ${t.corrects[idx] || 0}</div>
          </div>
        `;
      });
      titleEl.textContent = `🏆 Juara Lomba (${durLabel}): ${winnerName}!`;
      this.audio.playSfx("win");
    } else if (this.players.length === 2) {
      const [p1, p2] = this.players;
      board.innerHTML = `
        <div class="bg-emerald-900/80 border-2 border-emerald-400 rounded-2xl p-4 text-center sm:col-span-2">
          <div class="text-sm font-bold text-emerald-200">${p1.name}</div>
          <div class="text-3xl font-black text-amber-300 mt-1">${p1.score} Poin</div>
          <div class="text-xs text-white mt-1">Benar: ${p1.correctCount} dari ${p1.answeredCount} Soal</div>
        </div>
        <div class="bg-amber-900/80 border-2 border-amber-400 rounded-2xl p-4 text-center sm:col-span-2">
          <div class="text-sm font-bold text-amber-200">${p2.name}</div>
          <div class="text-3xl font-black text-white mt-1">${p2.score} Poin</div>
          <div class="text-xs text-white mt-1">Benar: ${p2.correctCount} dari ${p2.answeredCount} Soal</div>
        </div>
      `;
      if (p1.score > p2.score) {
        titleEl.textContent = `🏆 ${p1.name} Menang Duel (${durLabel})!`;
        this.audio.playSfx("win");
      } else if (p2.score > p1.score) {
        titleEl.textContent = `🏆 ${p2.name} Menang Duel (${durLabel})!`;
        this.audio.playSfx("win");
      } else {
        titleEl.textContent = `🤝 Duel Berakhir SERI (${p1.score} Poin)!`;
        this.audio.playSfx("win");
      }
    } else {
      const p1 = this.players[0];
      const com = this.comState;
      board.innerHTML = `
        <div class="bg-emerald-900/80 border-2 border-emerald-400 rounded-2xl p-4 text-center sm:col-span-2">
          <div class="text-sm font-bold text-emerald-200">${p1.name}</div>
          <div class="text-3xl font-black text-amber-300 mt-1">${p1.score} Poin</div>
          <div class="text-xs text-white mt-1">Benar: ${p1.correctCount} dari ${p1.answeredCount} Soal (${durLabel})</div>
        </div>
        <div class="bg-amber-900/80 border-2 border-amber-400 rounded-2xl p-4 text-center sm:col-span-2">
          <div class="text-sm font-bold text-emerald-200">${com.name}</div>
          <div class="text-3xl font-black text-white mt-1">${com.score} Poin</div>
          <div class="text-xs text-white mt-1">Benar: ${com.correctCount || 0} dari ${com.qIndex} Soal (${durLabel})</div>
        </div>
      `;
      if (p1.score >= com.score) {
        titleEl.textContent = `🏆 Misi Tuntas! Kamu Mengungguli COM!`;
        this.audio.playSfx("win");
      } else {
        titleEl.textContent = `🌱 Sesi Selesai! Ayo Kumpulkan Lebih Banyak Poin!`;
        this.audio.playSfx("lose");
      }
    }

    const reviewContainer = document.getElementById("result-review-list");
    reviewContainer.innerHTML = this.sessionHistory.map((item, idx) => `
      <div class="bg-black/45 border-l-4 ${item.isCorrect ? 'border-green-400' : 'border-rose-500'} rounded-xl p-3 text-xs md:text-sm">
        <div class="flex items-center justify-between font-bold text-amber-200">
          <span>#${idx + 1} [${item.qId}] • ${item.playerName}</span>
          <span class="${item.isCorrect ? 'text-green-400' : 'text-rose-400'}">${item.isCorrect ? '✓ BENAR' : '✗ KURANG TEPAT'}</span>
        </div>
        <p class="font-bold text-white mt-1">${item.question}</p>
        <p class="text-emerald-200 mt-1">Jawabanmu: <strong>${item.chosen}</strong> | Kunci: <strong>${item.correctAnswer}</strong></p>
        <p class="text-amber-100/90 mt-1 bg-white/5 p-2 rounded-lg">💡 <strong>Pembahasan:</strong> ${item.explanation}</p>
      </div>
    `).join("");
  }

  mainLoop(now) {
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    if(now-(this._lastSensorStatus||0)>400){this.detector.updateStatus();this._lastSensorStatus=now;}

    if (this.state === "CALIB") {
      this.updateCalibrationMotion(dt, now);
    } else if (this.state === "PLAYING") {
      this.updateGameplayLoop(now, dt);
    }

    this.detector.renderOverlay();
    requestAnimationFrame((t) => this.mainLoop(t));
  }


  updateCalibrationMotion(dt,now) {
    const target=document.getElementById("practice-target");if(!target)return;
    this.detector.detectPalmsInFrame();
    now=performance.now();
    const rect=target.getBoundingClientRect(),height=this.detector.getVideoDisplayBox().screenH;
    const events=this.practiceTracker.update(this.detector.detectedPalms,[rect],now,height);
    if(events.length && this.practiceHits<3 && now-this.practiceLastHitAt>=350){
      this.practiceLastHitAt=now;this.practiceHits++;
      this.detector.spawnParticles(events[0].x,events[0].y,"#4ADE80");
      this.audio.playTone(420+this.practiceHits*130,.1,"triangle",.2);
      target.classList.remove("shield-hit");void target.offsetWidth;target.classList.add("shield-hit");
      target.style.boxShadow="0 0 30px #4ade80";
      setTimeout(()=>target.style.boxShadow="",250);
    }
    document.getElementById("practice-progress").style.width=(this.practiceHits/3*100)+"%";
    document.getElementById("practice-hit-count").textContent=this.practiceHits+" / 3 pukulan";
    document.getElementById("practice-timer-label").textContent=this.practiceHits>=3
      ?"Berhasil! Sensor merespons. Tekan Mulai Bermain."
      :"Pukul target, tarik tangan keluar, lalu pukul lagi.";
    const indicator=document.getElementById("practice-hand-count");
    indicator.textContent=this.detector.modelReady
      ?this.detector.detectedPalms.length+" tangan terdeteksi"
      :"Sensor belum siap — lihat status di atas";
  }

  updateGameplayLoop(now, dt) {
    const isUnlimitedTime = this.sessionDurationSec === 0;
    const sessionTimerEl = document.getElementById("hud-session-timer");
    const sessionTimerBox = document.getElementById("hud-session-timer-box");

    if (isUnlimitedTime) {
      if (sessionTimerEl) sessionTimerEl.textContent = "♾️ TANPA WAKTU";
      if (sessionTimerBox) {
        sessionTimerBox.className = "flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500 text-slate-950 font-black text-xs md:text-sm shadow-lg border-2 border-sky-200";
      }
    } else {
      this.sessionTimeLeft = Math.max(0, this.sessionTimeLeft - dt);
      if (sessionTimerEl) {
        sessionTimerEl.textContent = this.formatDurationMMSS(this.sessionTimeLeft);
      }
      if (sessionTimerBox) {
        if (this.sessionTimeLeft <= 10) {
          sessionTimerBox.className = "flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-xs md:text-sm shadow-lg border-2 border-rose-200 animate-pulse";
          const ceilSec = Math.ceil(this.sessionTimeLeft);
          if (ceilSec > 0 && ceilSec !== this.lastCountdownBeepSec) {
            this.lastCountdownBeepSec = ceilSec;
            this.audio.playTone(880, 0.06, "square", 0.15);
          }
        } else if (this.sessionTimeLeft <= 60) {
          sessionTimerBox.className = "flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs md:text-sm shadow-lg border-2 border-amber-200";
        } else {
          sessionTimerBox.className = "flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs md:text-sm shadow-lg border-2 border-emerald-200";
        }
      }

      if (this.sessionTimeLeft <= 0) {
        this.players.forEach((p, idx) => {
          p.finished = true;
          this.renderPlayerQuestion(idx);
        });
        this.checkSessionCompletion();
        return;
      }
    }

    this.updateFloatingBubblesPhysics(dt, now);

    const zoneRectsByPlayer = {};
    this.players.forEach((p, idx) => {
      if (p.finished) return;
      const rects = [];
      for (let q = 0; q < 4; q++) {
        const el = document.getElementById(`quad-p${idx}-${q}`);
        if (el) rects.push(el.getBoundingClientRect());
      }
      if (rects.length === 4) zoneRectsByPlayer[idx] = rects;
    });

    if (this.detector.cameraReady && !this.detector.modelReady && !this.detector.modelLoading && !this.detector._runtimeFailed && now - (this._lastModelRetry || 0) > 8000) {
      this._lastModelRetry = now;
      this.detector.initHandModel();
    }
    const motionResult = this.detector.analyzeZones(zoneRectsByPlayer);

    const lightEl = document.getElementById("lighting-indicator");
    if (lightEl) {
      if (!motionResult.cameraActive || !motionResult.modelReady) {
        lightEl.textContent = "📷 Sensor belum siap • cek kamera/model";
        lightEl.className = "font-bold text-amber-300";
      } else if (motionResult.palmCount > 0) {
        lightEl.textContent = `🖐️ ${motionResult.palmCount} Telapak Tangan Terdeteksi`;
        lightEl.className = "font-bold text-green-300";
      } else {
        lightEl.textContent = "🖐️ Angkat telapak, ayunkan ke target, tarik kembali";
        lightEl.className = "font-bold text-amber-200";
      }
    }

    this.players.forEach((p, idx) => {
      if (p.finished) return;

      if (p.feedbackUntil && now > p.feedbackUntil) {
        const fbEl = document.getElementById(`vp-feedback-p${idx}`);
        if (fbEl) fbEl.classList.add("hidden");
        p.feedbackUntil = 0;
      }

      const timerEl = document.getElementById(`vp-timer-p${idx}`);

      const isReadingPhase = now < p.readPhaseUntil;
      if (isReadingPhase) {
        p.dwellProgress = 0;
        p.dwellTarget = -1;
      } else {
        if (isUnlimitedTime) {
          if (timerEl) timerEl.textContent = "♾️ Santai";
        } else {
          p.questionTimeLeft = Math.max(0, p.questionTimeLeft - dt);
          if (timerEl) timerEl.textContent = `${p.questionTimeLeft.toFixed(1)}s`;

          if (p.questionTimeLeft <= 0) {
            this.submitAnswer(idx, -1, false);
            return;
          }
        }
      }


      const box=this.detector.getVideoDisplayBox();
      const hands=this.detector.detectedPalms.filter(hand=>this.players.length!==2 ||
        (idx===0?hand.cx<box.arenaCenterX:hand.cx>=box.arenaCenterX));
      if(isReadingPhase||now<p.cooldownUntil||!zoneRectsByPlayer[idx]){
        p.strikeTracker.reset();
      }else{
        const events=p.strikeTracker.update(hands,zoneRectsByPlayer[idx],performance.now(),box.screenH);
        for(const hit of events){this.registerHit(idx,hit.target,hit.x,hit.y);break;}
      }
      for(let q=0;q<4;q++){
        const el=document.getElementById("quad-p"+idx+"-"+q),bar=document.getElementById("quad-bar-p"+idx+"-"+q);
        if(!el||!bar)continue;
        const progress=p.hits[q]||0;
        el.classList.toggle("aiming",progress>0);
        el.classList.toggle("locked",progress>=this.hitsToBreak);
        el.dataset.dmg=String(Math.min(2,progress));
        bar.style.width=(progress/this.hitsToBreak*100)+"%";
        const count=document.getElementById("quad-hits-p"+idx+"-"+q);
        if(count)count.textContent=progress+" / "+this.hitsToBreak+" pukulan";
      }
    });

    if (this.comState && (isUnlimitedTime || this.sessionTimeLeft > 0)) {
      if (now >= this.comState.nextActionAt) {
        const isComCorrect = Math.random() < this.comState.accuracy; window.AnimeCharacters?.react("arka", isComCorrect ? "cheer" : "oops");
        this.comState.qIndex++;
        if (isComCorrect) {
          this.comState.score += 118;
          this.comState.correctCount = (this.comState.correctCount || 0) + 1;
        }
        const comStatusEl = document.getElementById("com-live-status");
        if (comStatusEl) {
          comStatusEl.textContent = isComCorrect
            ? `COM menjawab benar Soal #${this.comState.qIndex} (+118 Poin)`
            : `COM meleset pada Soal #${this.comState.qIndex}`;
        }
        document.getElementById("hud-p2-score").textContent = `${this.comState.score} Poin`;
        this.comState.nextActionAt = now + 6200 + Math.random() * 2000;
      }
    }
  }

}

window.addEventListener("DOMContentLoaded", () => {
  window.gameApp = new EcosystemQuadrantGame();
});
