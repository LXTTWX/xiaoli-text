// 全局配置与状态
const CONFIG = {
    targetDate: new Date('2026-06-09T17:00:00').getTime(),
    startDate: new Date('2024-08-26T08:00:00').getTime()
};

// --- 音频反馈系统 (Web Audio API) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function playSound(type) {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// 给所有可交互元素添加音效
document.addEventListener('click', (e) => {
    if (e.target.closest('button, .timeline-item, .quote-card, .photo-item')) {
        playSound('click');
    }
}, { passive: true });

// --- 动画调度器 ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

// 将观察逻辑封装为函数
function observeElements() {
    document.querySelectorAll('.module-section, .timeline-item').forEach(el => {
        observer.observe(el);
    });
}

// --- 模块 2: 高考结束计时器 (翻页时钟) ---
let currentTimerData = { days: -1, hours: -1, minutes: -1, seconds: -1 };

// 相识已挂钟 Canvas 动画循环
let sinceClockRAF = null;
function drawSinceClock() {
    const canvas = document.getElementById('since-clock');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 20;

    ctx.clearRect(0, 0, w, h);

    // 表盘背景
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fill();

    // 外圆环
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 内侧装饰圆环
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 刻度线
    for (let i = 0; i < 60; i++) {
        const angle = (i * 6 - 90) * Math.PI / 180;
        const isHour = i % 5 === 0;
        const innerR = isHour ? r - 25 : r - 15;
        const outerR = r - 8;

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.strokeStyle = isHour ? 'rgba(212, 175, 55, 0.9)' : 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = isHour ? 3 : 1;
        ctx.stroke();
    }

    // 小时数字
    ctx.font = '20px Georgia, serif';
    ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const nr = r - 40;
        ctx.fillText(i.toString(), cx + Math.cos(angle) * nr, cy + Math.sin(angle) * nr);
    }

    // 计算相识已时间
    const diff = Date.now() - CONFIG.startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const totalSec = diff / 1000;
    const secFrac = totalSec % 60;
    const mins = Math.floor(totalSec / 60) % 60;
    const hrs = Math.floor(totalSec / 3600) % 12;

    // 时针角度
    const hAngle = ((hrs + mins / 60) * 30 - 90) * Math.PI / 180;
    // 分针角度
    const mAngle = ((mins + secFrac / 60) * 6 - 90) * Math.PI / 180;
    // 秒针角度（平滑连续）
    const sAngle = (secFrac * 6 - 90) * Math.PI / 180;

    // 时针：粗短，金色
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(hAngle) * 12, cy - Math.sin(hAngle) * 12);
    ctx.lineTo(cx + Math.cos(hAngle) * r * 0.48, cy + Math.sin(hAngle) * r * 0.48);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 分针：中等，淡金
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(mAngle) * 12, cy - Math.sin(mAngle) * 12);
    ctx.lineTo(cx + Math.cos(mAngle) * r * 0.68, cy + Math.sin(mAngle) * r * 0.68);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 秒针：细长，化学蓝
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(sAngle) * 22, cy - Math.sin(sAngle) * 22);
    ctx.lineTo(cx + Math.cos(sAngle) * r * 0.82, cy + Math.sin(sAngle) * r * 0.82);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 中心圆点
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0e17';
    ctx.fill();

    // 更新右侧时间数值
    const dEl = document.getElementById('since-days');
    const hEl = document.getElementById('since-hours');
    const mEl = document.getElementById('since-mins');
    const sEl = document.getElementById('since-secs');
    const dispHrs = Math.floor(totalSec / 3600) % 24;
    const dispSec = Math.floor(secFrac);
    if (dEl) dEl.textContent = days;
    if (hEl) hEl.textContent = dispHrs;
    if (mEl) mEl.textContent = mins;
    if (sEl) sEl.textContent = dispSec;

    sinceClockRAF = requestAnimationFrame(drawSinceClock);
}

// 启动挂钟动画
function startSinceClock() {
    if (sinceClockRAF) cancelAnimationFrame(sinceClockRAF);
    drawSinceClock();
}

function updateFlipCard(id, newValue) {
    const card = document.getElementById(id);
    if (!card) return;
    
    const valueStr = newValue.toString().padStart(2, '0');
    const top = card.querySelector('.top');
    const bottom = card.querySelector('.bottom');
    
    // 如果值没有改变，不需要翻页动画
    if (top.textContent.trim() === valueStr) return;

    // 清理之前的动画元素
    const oldFlipTop = card.querySelector('.flip-top');
    const oldFlipBottom = card.querySelector('.flip-bottom');
    if (oldFlipTop) oldFlipTop.remove();
    if (oldFlipBottom) oldFlipBottom.remove();

    // 记录旧值
    const oldValueStr = top.textContent.trim();
    
    // 准备翻转的前半段（上半部往下翻）
    const flipTop = document.createElement('div');
    flipTop.className = 'flip-top';
    flipTop.innerHTML = `<span>${oldValueStr}</span>`;
    
    // 准备翻转的后半段（下半部往下翻出）
    const flipBottom = document.createElement('div');
    flipBottom.className = 'flip-bottom';
    flipBottom.innerHTML = `<span>${valueStr}</span>`;

    // 插入动画元素
    card.appendChild(flipTop);
    card.appendChild(flipBottom);

    // 动画进行到一半时，改变背景静态值
    setTimeout(() => {
        top.innerHTML = `<span>${valueStr}</span>`;
    }, 250);

    // 动画结束时，更新下半部分并清理DOM
    setTimeout(() => {
        bottom.innerHTML = `<span>${valueStr}</span>`;
        flipTop.remove();
        flipBottom.remove();
    }, 500);
}

function updateTimer() {
    const now = new Date().getTime();
    const diff = now - CONFIG.targetDate;

    if (diff < 0) {
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days !== currentTimerData.days) { updateFlipCard('flip-days', days); currentTimerData.days = days; }
    if (hours !== currentTimerData.hours) { updateFlipCard('flip-hours', hours); currentTimerData.hours = hours; }
    if (minutes !== currentTimerData.minutes) { updateFlipCard('flip-minutes', minutes); currentTimerData.minutes = minutes; }
    if (seconds !== currentTimerData.seconds) { updateFlipCard('flip-seconds', seconds); currentTimerData.seconds = seconds; }
}

// 相识已计时器已替换为挂钟 Canvas，由 rAF 驱动

// 每秒触发一次翻页检查（仅高考结束计时器）
setInterval(() => {
    if (!document.hidden) {
        updateTimer();
    }
}, 1000);

// 初始化第一次渲染
updateTimer();
startSinceClock();

// --- 模块 1: 新 Hero Banner 动画 & 音频控制面板 ---
function initHero() {
    const btnToggle = document.getElementById('btn-audio-toggle');
    const iconMute = document.getElementById('icon-mute');
    const iconPlay = document.getElementById('icon-play');
    const audioPanel = document.getElementById('audio-panel');
    const btnClose = document.getElementById('btn-panel-close');
    const bgmPlayer = document.getElementById('bgm-player');
    const volumeSlider = document.getElementById('volume-slider');
    const trackNameEl = document.getElementById('current-track-name');
    const btnPrev = document.getElementById('btn-prev-track');
    const btnNext = document.getElementById('btn-next-track');
    const btnPlayPause = document.getElementById('btn-play-pause');
    const panelIconPlay = document.getElementById('panel-icon-play');
    const panelIconPause = document.getElementById('panel-icon-pause');
    const progressSlider = document.getElementById('progress-slider');
    const progressFill = document.getElementById('progress-fill');
    const timeCurrentEl = document.getElementById('time-current');
    const timeDurationEl = document.getElementById('time-duration');

    if (!bgmPlayer || !btnToggle) return;

    // 音频数据配置
    const tracks = [
        { src: '凤凰花开的路口 - 林志炫.mp3', name: '凤凰花开的路口' },
        { src: 'tomorrow-zhangjie.mp3', name: '明天过后' },
        { src: 'nocrazy-liyuchun.mp3', name: '再不疯狂我们就老了' },
        { src: '下一段旅程 - 杨和苏KeyNG、张杰.mp3', name: '下一段旅程' },
        { src: '当你 - 林俊杰.mp3', name: '当你' },
        { src: '爱，存在2026 - 王鹤棣、魏奇奇.flac', name: '爱，存在2026' }
    ];
    let currentTrackIdx = 0;
    
    // 初始化持久化音量与曲目状态
    const savedVolume = localStorage.getItem('class7_volume');
    if (savedVolume !== null) {
        bgmPlayer.volume = parseFloat(savedVolume);
        volumeSlider.value = savedVolume;
    } else {
        bgmPlayer.volume = 0.5;
        volumeSlider.value = 0.5;
    }
    
    const savedTrackIdx = localStorage.getItem('class7_track_idx');
    if (savedTrackIdx !== null && tracks[savedTrackIdx]) {
        currentTrackIdx = parseInt(savedTrackIdx);
    }
    
    // 加载当前曲目
    function loadTrack(idx, autoPlay = false) {
        currentTrackIdx = idx;
        const track = tracks[currentTrackIdx];
        // 对中文文件名进行 URL 编码，避免 http-server 找不到文件
        bgmPlayer.src = encodeURI(track.src);
        trackNameEl.textContent = track.name;
        localStorage.setItem('class7_track_idx', currentTrackIdx);
        
        if (autoPlay) {
            bgmPlayer.play().catch(e => console.log('Autoplay prevented', e));
            updatePlayIcon(true);
        }
    }
    
    function updatePlayIcon(isPlaying) {
        if (isPlaying) {
            iconMute.classList.add('hidden');
            iconPlay.classList.remove('hidden');
            panelIconPlay.classList.add('hidden');
            panelIconPause.classList.remove('hidden');
            btnToggle.classList.add('is-playing');
        } else {
            iconMute.classList.remove('hidden');
            iconPlay.classList.add('hidden');
            panelIconPlay.classList.remove('hidden');
            panelIconPause.classList.add('hidden');
            btnToggle.classList.remove('is-playing');
        }
    }

    loadTrack(currentTrackIdx, false); // 默认不自动播放
    // 同步初始化状态
    updatePlayIcon(!bgmPlayer.paused);

    // 唤起与关闭面板
    btnToggle.addEventListener('click', () => {
        playSound('click');
        audioPanel.classList.toggle('hidden');
    });

    btnClose.addEventListener('click', () => {
        playSound('click');
        audioPanel.classList.add('hidden');
    });

    // 播放/暂停控制
    btnPlayPause.addEventListener('click', () => {
        playSound('click');
        if (bgmPlayer.paused) {
            bgmPlayer.play().catch(e => console.error(e));
        } else {
            bgmPlayer.pause();
        }
    });

    // 播放/暂停联动
    bgmPlayer.addEventListener('play', () => updatePlayIcon(true));
    bgmPlayer.addEventListener('pause', () => updatePlayIcon(false));

    // 加载失败时自动跳转下一首
    bgmPlayer.addEventListener('error', () => {
        console.warn(`歌曲加载失败: ${tracks[currentTrackIdx].src}`);
        const nextIdx = (currentTrackIdx + 1) % tracks.length;
        loadTrack(nextIdx, !bgmPlayer.paused);
    });
    
    // 格式化时间为 mm:ss
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // 监听音频元数据加载，初始化总时长
    bgmPlayer.addEventListener('loadedmetadata', () => {
        timeDurationEl.textContent = formatTime(bgmPlayer.duration);
    });

    // 监听播放进度更新，同步进度条与时间
    bgmPlayer.addEventListener('timeupdate', () => {
        if (!bgmPlayer.duration) return;
        timeCurrentEl.textContent = formatTime(bgmPlayer.currentTime);
        // 如果用户正在拖拽进度条，就不去覆盖 slider 的 value 以免冲突
        if (!isDraggingProgress) {
            const percent = (bgmPlayer.currentTime / bgmPlayer.duration) * 100;
            progressSlider.value = percent;
            progressFill.style.width = percent + '%';
        }
    });

    // 进度条拖拽控制
    let isDraggingProgress = false;
    
    progressSlider.addEventListener('mousedown', () => isDraggingProgress = true);
    progressSlider.addEventListener('touchstart', () => isDraggingProgress = true, {passive: true});
    
    // 拖动过程中仅更新视觉，不触发真实的currentTime修改，保证顺畅
    progressSlider.addEventListener('input', (e) => {
        const percent = e.target.value;
        progressFill.style.width = percent + '%';
        if (bgmPlayer.duration) {
            timeCurrentEl.textContent = formatTime((percent / 100) * bgmPlayer.duration);
        }
    });

    const finishDrag = (e) => {
        if (!isDraggingProgress) return;
        isDraggingProgress = false;
        if (bgmPlayer.duration) {
            bgmPlayer.currentTime = (e.target.value / 100) * bgmPlayer.duration;
        }
    };
    
    progressSlider.addEventListener('change', finishDrag);
    progressSlider.addEventListener('mouseup', finishDrag);
    progressSlider.addEventListener('touchend', finishDrag);

    // 单曲播放完毕后自动切下一首
    bgmPlayer.addEventListener('ended', () => {
        const nextIdx = (currentTrackIdx + 1) % tracks.length;
        loadTrack(nextIdx, true);
    });

    // 调节音量 (修正兼容性监听)
    const updateVolume = (e) => {
        const v = parseFloat(e.target.value);
        bgmPlayer.volume = v;
        localStorage.setItem('class7_volume', v);
        // 若音量从0调大且之前未播放，则尝试自动播放（仅在用户已经有交互记录时）
        if (v > 0 && bgmPlayer.paused && typeof hasInteracted !== 'undefined' && hasInteracted) {
            bgmPlayer.play().catch(e => {});
        }
    };
    
    // 同时监听 input 和 change，确保拖动过程和松开后都能生效
    volumeSlider.addEventListener('input', updateVolume);
    volumeSlider.addEventListener('change', updateVolume);

    // 切歌
    btnPrev.addEventListener('click', () => {
        playSound('click');
        const prevIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
        loadTrack(prevIdx, true);
    });

    btnNext.addEventListener('click', () => {
        playSound('click');
        const nextIdx = (currentTrackIdx + 1) % tracks.length;
        loadTrack(nextIdx, true);
    });

    // --- 首次滑动自动播放逻辑 ---
    let hasInteracted = false;
    const handleFirstInteraction = () => {
        if (hasInteracted) return;
        hasInteracted = true;
        // 用户发生滑动交互时尝试播放
        if (bgmPlayer.paused) {
            bgmPlayer.play().then(() => {
                showToast(`正在播放：${tracks[currentTrackIdx].name}`, 2000);
            }).catch(e => {
                console.log('Scroll autoplay prevented by browser policy');
            });
        }
        // 清理监听器
        window.removeEventListener('scroll', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('scroll', handleFirstInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true, once: true });
}

// --- 模块 9: 互动烧杯 ---
function initBeaker() {
    const canvas = document.getElementById('beaker-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('beaker-status');

    // 高清屏适配与固定逻辑尺寸
    const logicalWidth = 300;
    const logicalHeight = 400;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';
    ctx.scale(dpr, dpr);

    // 定义进阶阶段状态
    const states = [
        { name: '初遇：清澈如水', color: [200, 210, 220], alpha: 0.15, level: 0.25 },
        { name: '熟悉：融洽的蓝', color: [0, 229, 255], alpha: 0.5, level: 0.45 },
        { name: '拼搏：炽热的紫', color: [156, 39, 176], alpha: 0.65, level: 0.65 },
        { name: '回忆：青春的沉淀', color: [255, 193, 7], alpha: 0.8, level: 0.85 }
    ];
    let currentState = 0;

    // 当前平滑过渡的属性
    let currentColor = [...states[0].color];
    let currentAlpha = states[0].alpha;
    let currentLevel = states[0].level;

    // 物理与交互参数
    let waveOffset = 0;
    let stirIntensity = 0;
    let targetStir = 0;
    let mouseX = logicalWidth / 2;
    let bubbles = [];
    let drops = [];
    let splashes = [];

    // 辅助函数：线性插值
    const lerp = (start, end, t) => start * (1 - t) + end * t;

    // 鼠标/触摸移动控制“搅拌”
    const handleMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const newMouseX = (clientX - rect.left) * (logicalWidth / rect.width);
        
        // 计算移动速度带来搅拌强度
        const speed = Math.abs(newMouseX - mouseX);
        targetStir = Math.min(targetStir + speed * 0.15, 6);
        mouseX = newMouseX;
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    
    canvas.addEventListener('mouseleave', () => targetStir = 0);
    canvas.addEventListener('touchend', () => targetStir = 0);

    // 点击滴加记忆试剂
    let clickCount = 0;
    const handleClick = (e) => {
        if (clickCount >= 8) return; // 满状态后禁止创建新液滴
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clickX = (clientX - rect.left) * (logicalWidth / rect.width);
        
        // 确保有下一个状态颜色，如果没有则使用当前状态颜色
        const dropColor = currentState + 1 < states.length ? states[currentState + 1].color : states[states.length - 1].color;
        
        drops.push({
            x: clickX,
            y: -20,
            vy: 2,
            color: dropColor
        });
        
        playSound('hover'); // 模拟滴落声
    };
    
    canvas.addEventListener('click', handleClick);

    function transitionState() {
        // 喷泉已触发后，忽略后续多余的液滴落入事件
        if (clickCount >= 8) return;

        if (currentState < states.length - 1) {
            currentState++;
            statusEl.style.opacity = 0;
            setTimeout(() => {
                if (states[currentState]) {
                    statusEl.textContent = states[currentState].name;
                    statusEl.style.opacity = 1;
                    statusEl.style.textShadow = `0 0 15px rgba(${states[currentState].color.join(',')}, 0.8)`;
                    statusEl.style.borderColor = `rgba(${states[currentState].color.join(',')}, 0.5)`;
                }
            }, 300);
        }
        
        playSound('success');
        clickCount++;
        
        // 精确在第8次滴入时触发大象喷泉（仅触发一次）
        if (clickCount === 8) {
            console.log('[Fountain] clickCount === 8, scheduling triggerElephantFountain in 600ms');
            // 更新状态文字为喷泉提示
            statusEl.style.opacity = 0;
            setTimeout(() => {
                statusEl.textContent = '大象喷泉：青春的喷涌';
                statusEl.style.opacity = 1;
                statusEl.style.textShadow = '0 0 15px rgba(255, 193, 7, 0.8)';
                statusEl.style.borderColor = 'rgba(255, 193, 7, 0.5)';
            }, 300);
            // 立即平静液面，不再激荡
            targetStir = 0;
            stirIntensity = 0;
            // 清除残留的空中液滴
            drops.length = 0;
            setTimeout(() => {
                triggerElephantFountain();
            }, 600);
        }
    }

    // 大象喷泉：满状态时金色泡沫柱从烧杯口喷涌（持续10秒，含辉光粒子）
    let elephantFountainRunning = false;
    function triggerElephantFountain() {
        console.log('[Fountain] triggerElephantFountain CALLED, elephantFountainRunning:', elephantFountainRunning);
        if (elephantFountainRunning) return;
        elephantFountainRunning = true;

        const fountain = document.getElementById('elephant-fountain');
        console.log('[Fountain] element found:', !!fountain, 'element:', fountain);
        if (!fountain) { elephantFountainRunning = false; return; }

        const fountainDuration = 10000;
        const startTime = Date.now();
        const particles = []; // 主喷泉粒子
        const drips = [];     // 溢流滴粒子
        const rains = [];     // 金雨粒子

        const nozzleX = logicalWidth / 2;
        const nozzleY = 60;
        const bottomLimit = 370;

        // === 装饰元素：光柱 + 光核 + 泡沫 + 底部光环 ===
        const flash = document.createElement('div');
        flash.className = 'fountain-flash';
        fountain.appendChild(flash);
        setTimeout(() => flash.remove(), 700);

        const glowColumn = document.createElement('div');
        glowColumn.className = 'fountain-glow';
        fountain.appendChild(glowColumn);
        const glowCore = document.createElement('div');
        glowCore.className = 'fountain-glow-core';
        fountain.appendChild(glowCore);
        const foam = document.createElement('div');
        foam.className = 'fountain-foam';
        fountain.appendChild(foam);
        const baseRing = document.createElement('div');
        baseRing.className = 'fountain-base-ring';
        fountain.appendChild(baseRing);
        const decorElements = [glowColumn, glowCore, foam, baseRing];

        // 颜色阶段：金色→青蓝→紫→粉红→金色
        const colorPhases = [
            { h: 45, s: 100, l: 60 }, { h: 190, s: 100, l: 55 },
            { h: 280, s: 80, l: 65 }, { h: 340, s: 90, l: 65 }, { h: 45, s: 100, l: 60 }
        ];

        /** 根据时间插值获取当前色相 */
        function getCurrentColor(elapsed) {
            const p = Math.min(elapsed / fountainDuration, 1);
            const pi = p * (colorPhases.length - 1);
            const idx = Math.floor(pi);
            const t = pi - idx;
            const a = colorPhases[Math.min(idx, colorPhases.length - 1)];
            const b = colorPhases[Math.min(idx + 1, colorPhases.length - 1)];
            return { h: a.h + (b.h - a.h) * t, s: a.s + (b.s - a.s) * t, l: a.l + (b.l - a.l) * t };
        }

        /** 创建喷发粒子：7种类型随机混合 */
        function createDroplet(elapsed, burstMode) {
            const el = document.createElement('span');
            el.className = 'elephant';
            el.style.position = 'absolute';
            const rand = Math.random();
            const curColor = getCurrentColor(elapsed);

            if (rand < 0.18) {
                // 金色辉光圆粒子
                el.classList.add('glow-orb');
                const size = 6 + Math.random() * 10;
                el.style.width = size + 'px'; el.style.height = size + 'px';
            } else if (rand < 0.35) {
                // 彩色辉光圆粒子
                el.classList.add('color-orb');
                const size = 5 + Math.random() * 8;
                el.style.width = size + 'px'; el.style.height = size + 'px';
                const c = `hsl(${curColor.h + (Math.random()-0.5)*30}, ${curColor.s}%, ${curColor.l}%)`;
                el.style.background = c; el.style.color = c;
            } else if (rand < 0.52) {
                // 星芒粒子（带旋转闪烁）
                el.classList.add('sparkle');
                el.textContent = ['✦','✧','⟡','★','✵'][Math.floor(Math.random()*5)];
                el.style.color = `hsl(${curColor.h+(Math.random()-0.5)*20}, 100%, ${65+Math.random()*20}%)`;
                el.style.textShadow = `0 0 ${8+Math.random()*10}px hsla(${curColor.h},100%,70%,0.9)`;
                el.style.fontSize = (12+Math.random()*16)+'px';
            } else if (rand < 0.68) {
                // emoji粒子
                const emojis = ['🫧','💧','💦','✨','🌟','🔮'];
                el.textContent = emojis[Math.floor(Math.random()*emojis.length)];
                el.style.fontSize = (10+Math.random()*14)+'px';
            } else if (rand < 0.82) {
                // 彩色光点
                el.textContent = '•';
                const c = `hsl(${curColor.h+(Math.random()-0.5)*40}, ${curColor.s}%, ${curColor.l+10}%)`;
                el.style.color = c; el.style.textShadow = `0 0 12px ${c}`;
                el.style.fontSize = (14+Math.random()*20)+'px';
            } else if (rand < 0.92) {
                // 丝带状拖尾
                el.textContent = '～';
                const c = `hsl(${curColor.h}, ${curColor.s}%, ${curColor.l+15}%)`;
                el.style.color = c; el.style.textShadow = `0 0 8px ${c}`;
                el.style.fontSize = (10+Math.random()*12)+'px';
            } else {
                // 大号金色星（稀有）
                el.classList.add('sparkle');
                el.textContent = '🌟';
                el.style.fontSize = (20+Math.random()*16)+'px';
                el.style.filter = `drop-shadow(0 0 12px hsla(${curColor.h},100%,70%,0.8))`;
            }
            fountain.appendChild(el);

            // 喷射物理
            const pulsePhase = Math.sin(elapsed * 0.003) * 0.3;
            const spread = burstMode ? 2.2 : (1.4 + pulsePhase);
            const basePower = burstMode ? (20+Math.random()*14) : (12+Math.random()*12+Math.sin(elapsed*0.005)*3);
            const spreadAngle = (Math.random()-0.5) * spread;
            const swirl = Math.sin(elapsed*0.002+Math.random()*6) * 1.5;

            return {
                el, x: nozzleX+(Math.random()-0.5)*16, y: nozzleY,
                vx: Math.sin(spreadAngle)*basePower + swirl,
                vy: -Math.cos(spreadAngle)*basePower,
                life: 1, decay: 0.002+Math.random()*0.003,
                rotation: (Math.random()-0.5)*10,
                canSpawnSecondary: rand < 0.3 && !burstMode
            };
        }

        /** 创建溢流滴（沿杯壁下滑） */
        function createDrip() {
            const el = document.createElement('div');
            el.className = 'fountain-drip';
            const side = Math.random() < 0.5 ? -1 : 1;
            el.style.left = (nozzleX + side * (35 + Math.random()*15)) + 'px';
            el.style.top = '60px';
            fountain.appendChild(el);
            drips.push({ el, x: parseFloat(el.style.left), y: 60, vy: 0.5+Math.random()*1, life: 1, decay: 0.005+Math.random()*0.005 });
        }

        /** 创建金色粒子雨 */
        function createGoldRain() {
            const el = document.createElement('div');
            el.className = 'gold-rain';
            el.style.left = (nozzleX + (Math.random()-0.5)*120) + 'px';
            el.style.top = (-20 - Math.random()*60) + 'px';
            fountain.appendChild(el);
            rains.push({ el, x: parseFloat(el.style.left), y: parseFloat(el.style.top), vy: 1+Math.random()*2, vx: (Math.random()-0.5)*0.5, life: 1, decay: 0.003+Math.random()*0.003 });
        }

        /** 二次爆散 */
        function spawnSecondary(parentP) {
            for (let j = 0; j < 4; j++) {
                const el = document.createElement('span');
                el.className = 'elephant color-orb';
                el.style.position = 'absolute';
                const curColor = getCurrentColor(Date.now() - startTime);
                const size = 3+Math.random()*5;
                el.style.width = size+'px'; el.style.height = size+'px';
                const c = `hsl(${curColor.h+Math.random()*60}, 100%, 70%)`;
                el.style.background = c; el.style.color = c;
                fountain.appendChild(el);
                const angle = Math.random()*Math.PI*2;
                const speed = 2+Math.random()*5;
                particles.push({
                    el, x: parentP.x, y: parentP.y,
                    vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-2,
                    life: 0.7, decay: 0.015+Math.random()*0.01,
                    rotation: 0, canSpawnSecondary: false
                });
            }
        }

        // 周期性爆发计时
        let lastSurgeTime = 0;
        const surgeInterval = 2500; // 每 2.5秒一次脉冲爆发

        /** 喷泉主动画循环 */
        let animateCallCount = 0;
        function animate() {
            animateCallCount++;
            if (animateCallCount <= 3 || animateCallCount % 60 === 0) {
                console.log(`[Fountain] animate frame ${animateCallCount}, particles: ${particles.length}, drips: ${drips.length}, rains: ${rains.length}`);
            }
            const elapsed = Date.now() - startTime;

            if (elapsed < fountainDuration) {
                // 初始爆发 (前500ms)
                if (elapsed < 500) {
                    for (let i = 0; i < 12; i++) particles.push(createDroplet(elapsed, true));
                }

                // 周期性脉冲爆发
                if (elapsed - lastSurgeTime > surgeInterval && elapsed > 1000) {
                    lastSurgeTime = elapsed;
                    for (let i = 0; i < 20; i++) particles.push(createDroplet(elapsed, true));
                    // 爆发时产生溢流滴
                    for (let i = 0; i < 4; i++) createDrip();
                }

                // 正常喷涌
                const surge = Math.sin(elapsed*0.004)*0.5+0.5;
                let rate;
                if (elapsed < 3000) rate = Math.floor(5+surge*3);
                else if (elapsed < 7000) rate = Math.floor(3+surge*2);
                else rate = Math.max(1, Math.floor(2-(elapsed-7000)/3000));
                for (let i = 0; i < rate; i++) particles.push(createDroplet(elapsed, false));

                // 溢流滴（持续产生）
                if (Math.random() < 0.08) createDrip();

                // 金色粒子雨（后半段加强）
                const rainChance = elapsed > 5000 ? 0.15 : 0.05;
                if (Math.random() < rainChance) createGoldRain();
            }

            // 更新主喷泉粒子
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.vy += 0.10;
                p.x += p.vx; p.y += p.vy;
                p.life -= p.decay; p.vx *= 0.998;

                p.el.style.left = p.x+'px'; p.el.style.top = p.y+'px';
                let opacity = Math.max(0, Math.min(1, p.life*2.5));
                if (p.y < -80) opacity *= Math.max(0, 1-(Math.abs(p.y+80)/350));
                p.el.style.opacity = opacity;
                if (!p.el.classList.contains('sparkle')) {
                    p.el.style.transform = `scale(${0.4+p.life*0.6}) rotate(${p.rotation*(1-p.life)*20}deg)`;
                }
                if (p.canSpawnSecondary && p.vy > -1 && p.vy < 1 && p.life > 0.5) {
                    p.canSpawnSecondary = false; spawnSecondary(p);
                }
                if (p.life <= 0 || p.y > bottomLimit || p.y < -500) {
                    p.el.remove(); particles.splice(i, 1);
                }
            }

            // 更新溢流滴
            for (let i = drips.length - 1; i >= 0; i--) {
                const d = drips[i];
                d.vy += 0.05; d.y += d.vy; d.life -= d.decay;
                d.el.style.top = d.y + 'px';
                d.el.style.opacity = Math.max(0, d.life);
                if (d.life <= 0 || d.y > bottomLimit) {
                    d.el.remove(); drips.splice(i, 1);
                }
            }

            // 更新金雨
            for (let i = rains.length - 1; i >= 0; i--) {
                const r = rains[i];
                r.y += r.vy; r.x += r.vx; r.life -= r.decay;
                r.el.style.top = r.y+'px'; r.el.style.left = r.x+'px';
                r.el.style.opacity = Math.max(0, r.life);
                if (r.life <= 0 || r.y > bottomLimit) {
                    r.el.remove(); rains.splice(i, 1);
                }
            }

            // 光柱+泡沫+光环随喷涌阶段渐隐
            if (elapsed > fountainDuration * 0.7) {
                const fade = 1 - (elapsed - fountainDuration*0.7) / (fountainDuration*0.3);
                decorElements.forEach(el => el.style.opacity = Math.max(0, fade));
            }

            if (particles.length > 0 || drips.length > 0 || rains.length > 0 || elapsed < fountainDuration) {
                requestAnimationFrame(animate);
            } else {
                decorElements.forEach(el => el.remove());
                elephantFountainRunning = false;
            }
        }

        requestAnimationFrame(animate);
    }

    function createSplash(x, y, color) {
        for (let i = 0; i < 20; i++) {
            splashes.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 1) * 10,
                life: 1,
                color: color
            });
        }
    }

    function updatePhysics() {
        if (currentState >= states.length) return; // 边界保护
        const targetState = states[currentState] || states[states.length - 1]; // 兜底保护
        
        currentColor[0] = lerp(currentColor[0], targetState.color[0], 0.05);
        currentColor[1] = lerp(currentColor[1], targetState.color[1], 0.05);
        currentColor[2] = lerp(currentColor[2], targetState.color[2], 0.05);
        currentAlpha = lerp(currentAlpha, targetState.alpha, 0.05);
        currentLevel = lerp(currentLevel, targetState.level, 0.05);

        // 喷泉触发后：快速平静液面，停止气泡生成
        if (clickCount >= 8) {
            targetStir = 0;
            stirIntensity *= 0.9; // 快速衰减
            waveOffset += 0.02; // 仅保留微小波动
            // 清除残留空中液滴
            drops.length = 0;
            // 让残留飞溅和气泡自然消亡，不生成新的
            for (let i = splashes.length - 1; i >= 0; i--) {
                let s = splashes[i];
                s.x += s.vx; s.y += s.vy; s.vy += 0.4;
                s.life -= 0.025;
                if (s.life <= 0) splashes.splice(i, 1);
            }
            for (let i = bubbles.length - 1; i >= 0; i--) {
                let b = bubbles[i];
                b.y += b.vy; b.wobble += 0.1;
                b.x += Math.sin(b.wobble) * 0.8;
                bubbles.splice(i, 1); // 直接清除所有气泡
            }
            return;
        }

        targetStir *= 0.96; // 阻尼衰减
        stirIntensity = lerp(stirIntensity, targetStir, 0.1);
        
        waveOffset += 0.03 + stirIntensity * 0.02;

        // 液面高度 Y 坐标
        const liquidY = logicalHeight - (300 * currentLevel) - 30;

        // 更新滴落的试剂
        for (let i = drops.length - 1; i >= 0; i--) {
            let d = drops[i];
            d.vy += 0.6; // 重力
            d.y += d.vy;
            
            if (d.y >= liquidY) {
                createSplash(d.x, liquidY, d.color);
                drops.splice(i, 1);
                targetStir += 5; // 砸入液面产生激荡
                transitionState();
            }
        }

        // 更新飞溅粒子
        for (let i = splashes.length - 1; i >= 0; i--) {
            let s = splashes[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.4;
            s.life -= 0.025;
            if (s.life <= 0) splashes.splice(i, 1);
        }

        // 更新上升的气泡
        if (Math.random() < 0.03 + stirIntensity * 0.08) {
            bubbles.push({
                x: 70 + Math.random() * 160,
                y: logicalHeight - 40,
                r: Math.random() * 4 + 1.5,
                vy: - (Math.random() * 1.5 + 1 + stirIntensity * 0.5),
                wobble: Math.random() * Math.PI * 2
            });
        }

        for (let i = bubbles.length - 1; i >= 0; i--) {
            let b = bubbles[i];
            b.y += b.vy;
            b.wobble += 0.1;
            b.x += Math.sin(b.wobble) * 0.8;
            
            if (b.y < liquidY) {
                bubbles.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        
        const bLeft = 50;
        const bRight = 250;
        const bTop = 60;
        const bBottom = 360;
        const bRadius = 25;

        // 绘制烧杯后壁（营造 3D 圆柱感）
        ctx.beginPath();
        ctx.ellipse(logicalWidth/2, bBottom, (bRight - bLeft)/2, 12, 0, Math.PI, Math.PI*2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.stroke();

        const liquidHeight = (bBottom - bTop) * currentLevel;
        const liquidTop = bBottom - liquidHeight;
        const rgb = `${Math.round(currentColor[0])},${Math.round(currentColor[1])},${Math.round(currentColor[2])}`;

        ctx.save();
        // 剪裁区域限定在烧杯内部
        ctx.beginPath();
        ctx.moveTo(bLeft + 2, bTop);
        ctx.lineTo(bLeft + 2, bBottom - bRadius);
        ctx.quadraticCurveTo(bLeft + 2, bBottom - 2, bLeft + bRadius, bBottom - 2);
        ctx.lineTo(bRight - bRadius, bBottom - 2);
        ctx.quadraticCurveTo(bRight - 2, bBottom - 2, bRight - 2, bBottom - bRadius);
        ctx.lineTo(bRight - 2, bTop);
        ctx.clip();

        // 后层波浪 (错开相位与透明度)
        ctx.beginPath();
        ctx.moveTo(bLeft, liquidTop);
        for(let x = bLeft; x <= bRight; x += 5) {
            const tilt = (mouseX - logicalWidth/2) * 0.04 * (x - logicalWidth/2)/100;
            const y = liquidTop + Math.sin(x * 0.04 + waveOffset * 1.5) * (4 + stirIntensity * 1.5) + tilt;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(bRight, bBottom);
        ctx.lineTo(bLeft, bBottom);
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgb}, ${currentAlpha * 0.4})`;
        ctx.fill();

        // 前层波浪 (主液面，带有立体渐变)
        ctx.beginPath();
        ctx.moveTo(bLeft, liquidTop);
        for(let x = bLeft; x <= bRight; x += 5) {
            const tilt = (mouseX - logicalWidth/2) * 0.05 * (x - logicalWidth/2)/100;
            const y = liquidTop + Math.sin(x * 0.05 - waveOffset * 2.5) * (6 + stirIntensity * 2.5) - tilt;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(bRight, bBottom);
        ctx.lineTo(bLeft, bBottom);
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(0, liquidTop, 0, bBottom);
        grad.addColorStop(0, `rgba(${rgb}, ${currentAlpha})`);
        grad.addColorStop(1, `rgba(${rgb}, ${Math.min(1, currentAlpha * 1.8)})`);
        ctx.fillStyle = grad;
        ctx.fill();

        // 绘制气泡
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        bubbles.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            // 气泡高光
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
        });

        ctx.restore();

        // 绘制滴落的试剂
        drops.forEach(d => {
            ctx.beginPath();
            ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${d.color[0]},${d.color[1]},${d.color[2]})`;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(d.x - 6, d.y);
            ctx.lineTo(d.x, d.y - 18);
            ctx.lineTo(d.x + 6, d.y);
            ctx.fill();
        });

        // 绘制飞溅粒子
        splashes.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, 3 * s.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${s.life})`;
            ctx.fill();
            // 添加辉光
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgb(${s.color[0]},${s.color[1]},${s.color[2]})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 绘制烧杯主轮廓与玻璃反光
        ctx.beginPath();
        ctx.moveTo(bLeft, bTop);
        ctx.lineTo(bLeft, bBottom - bRadius);
        ctx.quadraticCurveTo(bLeft, bBottom, bLeft + bRadius, bBottom);
        ctx.lineTo(bRight - bRadius, bBottom);
        ctx.quadraticCurveTo(bRight, bBottom, bRight, bBottom - bRadius);
        ctx.lineTo(bRight, bTop);
        
        // 玻璃质感渐变
        const glassGrad = ctx.createLinearGradient(bLeft, 0, bRight, 0);
        glassGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
        glassGrad.addColorStop(0.1, 'rgba(255,255,255,0.1)');
        glassGrad.addColorStop(0.85, 'rgba(255,255,255,0.05)');
        glassGrad.addColorStop(0.95, 'rgba(255,255,255,0.4)');
        glassGrad.addColorStop(1, 'rgba(255,255,255,0.8)');
        ctx.lineWidth = 4;
        ctx.strokeStyle = glassGrad;
        ctx.stroke();

        // 底部边缘高光
        ctx.beginPath();
        ctx.ellipse(logicalWidth/2, bBottom, (bRight - bLeft)/2, 12, 0, 0, Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();

        // 刻度线
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        for(let i=0; i<=4; i++) {
            const y = bBottom - 50 - i * 60;
            if (y > bTop + 20) {
                ctx.beginPath();
                ctx.moveTo(bLeft, y);
                ctx.lineTo(bLeft + 15, y);
                ctx.stroke();
                ctx.fillText((i+1)*100 + 'ml', bLeft - 5, y + 4);
            }
        }

        // 杯口圆环
        ctx.beginPath();
        ctx.ellipse(logicalWidth/2, bTop, (bRight - bLeft)/2 + 4, 10, 0, 0, Math.PI*2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.stroke();

        updatePhysics();
        requestAnimationFrame(draw);
    }

    draw();
}

// --- 模块 3: 两年进程时间轴 ---
const timelineData = [
    { date: '2024.08.26', title: '初次相遇', desc: '那个初秋的早晨，您走进教室，笑着做了自我介绍。我们还不知道，接下来会一起走过这么远。' },
    { date: '2024.10.23—26', title: '第二十五届校运会', desc: '四天，您在看台上喊哑了嗓子，比场上的人还拼。那是我们第一次觉得，这个班主任有点不一样。' },
    { date: '2024.12.10', title: '篮球班赛', desc: '进球时全班沸腾，您在场边笑得比我们还开心。那天的夕阳很好看，但没人顾得上拍。' },
    { date: '2024.12.31', title: '"择友不滥，交友有节"主题班会', desc: '跨年夜不讲化学讲人生，您说的那些话，我们当时觉得啰嗦，后来却一遍一遍想起来。' },
    { date: '2025.01.05', title: '赴民族中学参加会考', desc: '大巴上闹成一团，您拿着名单反复清点人数。考试前最后一句叮嘱是"别忘写名字"。' },
    { date: '2025.01.21', title: '高二结束', desc: '最后一个高二下午，您在黑板上多写了一行字。那天教室里安静了很久，谁都没先走。' },
    { date: '2025.03.07', title: '母亲节插花活动', desc: '您教我们剪枝、配色、固定花泥。原来讲台下的小利老师，还有这么温柔的一面。' },
    { date: '2025.03.18', title: '跳蚤市场', desc: '吆喝声、砍价声、笑声混成一锅粥。您也来逛了一圈，最后买了一堆"没用的小东西"。' },
    { date: '2025.08.10', title: '晋江市紫峰中学2026届高三开班仪式', desc: '新教室、新桌椅、新的倒计时牌。您说"从今天起，每一天都算数"，我们信了。' },
    { date: '2025.09.02', title: '"写给自己的信"班会活动', desc: '您让我们给未来的自己写信。写完之后教室里很安静，有人在偷偷擦眼角。' },
    { date: '2025.10.15—18', title: '第二十六届校运会', desc: '最后一次校运会。加油声里多了不舍，合影时笑得特别用力，好像要把所有人都记住。' },
    { date: '2026.02.26', title: '高考百日誓师', desc: '一百天，您比我们任何人都紧张，却总说"没事的，相信美好的事情即将发生"。' },
    { date: '2026.06.07—09', title: '高考', desc: '三天，两年的化学反应终于走到了终点。放下笔的那一刻，我们才算真正毕业。' }
];

function initTimeline() {
    const container = document.getElementById('timeline');
    if(!container) return;
    
    timelineData.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `timeline-item ${index % 2 === 0 ? 'left' : 'right'}`;
        div.innerHTML = `
            <div class="timeline-content glass-panel">
                <h3>${item.date}</h3>
                <h4 style="color: var(--chem-blue)">${item.title}</h4>
                ${item.desc ? `<p>${item.desc}</p>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// --- 模块 11: 班级照片墙 ---
// 轻量EXIF日期读取（无依赖，支持大端/小端）
function readExifDate(url) {
    return fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => {
            const view = new DataView(buf);
            if(view.getUint16(0) !== 0xFFD8) return null;
            let offset = 2;
            while(offset < view.byteLength - 1) {
                if(view.getUint8(offset) !== 0xFF) { offset++; continue; }
                const marker = view.getUint8(offset + 1);
                if(marker === 0xE1) {
                    const size = view.getUint16(offset + 2);
                    const exifStart = offset + 4; // "Exif\0\0" 起始
                    const hdr = String.fromCharCode(view.getUint8(exifStart),view.getUint8(exifStart+1),view.getUint8(exifStart+2),view.getUint8(exifStart+3));
                    if(hdr === 'Exif') {
                        const tiffStart = exifStart + 6; // Exif头后6字节 = TIFF头
                        const little = view.getUint16(tiffStart) === 0x4949;
                        // 先读IFD0
                        let date = readIFD(view, tiffStart, little, 0x9003);
                        if(!date) date = readIFD(view, tiffStart, little, 0x0132);
                        // IFD0中找ExifIFD指针(tag 0x8769)，再去子目录找DateTimeOriginal
                        if(!date) {
                            const exifIFDPtr = readIFD(view, tiffStart, little, 0x8769);
                            if(exifIFDPtr) {
                                date = readIFD(view, tiffStart, little, 0x9003, parseInt(exifIFDPtr));
                                if(!date) date = readIFD(view, tiffStart, little, 0x0132, parseInt(exifIFDPtr));
                            }
                        }
                        return date;
                    }
                    offset += 2 + size;
                } else if((marker & 0xE0) === 0xE0) {
                    offset += 2 + view.getUint16(offset + 2);
                } else {
                    offset += 2;
                }
            }
            return null;
        })
        .catch(() => null);
}

function readIFD(view, tiffStart, little, targetTag, ifdOffsetArg) {
    const ifdOffset = ifdOffsetArg !== undefined ? ifdOffsetArg : view.getUint32(tiffStart + 4, little);
    const entries = view.getUint16(tiffStart + ifdOffset, little);
    for(let i = 0; i < entries; i++) {
        const e = tiffStart + ifdOffset + 2 + i * 12;
        const tag = view.getUint16(e, little);
        const type = view.getUint16(e + 2, little);
        const count = view.getUint32(e + 4, little);
        if(tag === targetTag) {
            let valOff;
            if(count <= 4) {
                valOff = e + 8;
            } else {
                valOff = tiffStart + view.getUint32(e + 8, little);
            }
            // ASCII string
            if(type === 2) {
                let s = '';
                for(let j = 0; j < count - 1; j++) s += String.fromCharCode(view.getUint8(valOff + j));
                return s;
            }
            return String(view.getUint32(e + 8, little));
        }
    }
    return null;
}

function formatExifDate(dateStr) {
    if(!dateStr) return '';
    const parts = dateStr.split(/[: ]/);
    if(parts.length < 3) return '';
    const y = parts[0];
    const m = parseInt(parts[1]);
    const d = parseInt(parts[2]);
    return `${y}年${m}月${d}日`;
}

function initPhotoWall() {
    const container = document.getElementById('photo-wall');
    if(!container) return;
    
    // 照片数据：文件名、标签、备注（仅JPG，HEIC文件浏览器不支持直接显示）
    const photos = [
        { file: 'a73cb4f03970f50d88ded339a76b0620.jpg', tag: 'Na 活力', note: '' },
        { file: '33e6f7f65e82d40ce9f44e59439c1c1a.jpg', tag: 'Fe 坚韧', note: '' },
        { file: '51125ef5b8ccb0e5c728e759f4924535.jpg', tag: 'Au 闪耀', note: '' },
        { file: '87cbf79f9688be8cc04360e1179c1f6d.JPG', tag: 'He 踏实', note: '' },
        { file: '5a535db376dc16e85a88a87ed7944ce4.JPG', tag: 'O 纯净', note: '' },
        { file: '7152992d5b694d4382446627eecf8721.JPG', tag: 'C 基础', note: '' },
        { file: '3bbb728730c5abf7d25a5c8377e8bc73.JPG', tag: 'H 温暖', note: '' },
        { file: '8caedb52bbac0b16e75a8d2955a81f27.JPG', tag: 'N 梦想', note: '' },
        { file: '54513674e5d3a53ff283217d870f1825.JPG', tag: 'S 快乐', note: '' },
        { file: '27878413e069254d4c67d5bd75211eb3.JPG', tag: 'P 希望', note: '' },
        { file: 'c0ea7143e1158c3865fbd7511f793fb3.JPG', tag: 'Cl 阳光', note: '' },
        { file: 'f94ea2409b137e95fb991b348528e22b.JPG', tag: 'K 友谊', note: '' },
        { file: '6ece2080278215ff8eab9b647ddb39a0.JPG', tag: 'Ca 稳重', note: '' },
        { file: 'd0b4320acf5ddab851e17c8c945841c1.JPG', tag: 'Zn 活泼', note: '' }
    ];
    
    // 解析EXIF日期字符串为Date对象
    function parseExifToDate(exifStr) {
        if(!exifStr) return null;
        const [datePart, timePart] = exifStr.split(' ');
        if(!datePart || !timePart) return null;
        const [y, m, d] = datePart.split(':');
        const [h, min, s] = timePart.split(':');
        return new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min), parseInt(s));
    }
    
    // 为每张照片预加载EXIF日期
    let sortMode = 'asc';
    
    // 渲染照片
    renderPhotos();
    
    photos.forEach(photo => {
        readExifDate(photo.file).then(date => {
            photo.exifDate = date || '';
            photo.dateObj = parseExifToDate(date);
        }).catch(() => {
            photo.exifDate = '';
            photo.dateObj = null;
        });
    });
    
    function renderPhotos() {
        container.innerHTML = '';
        const sorted = [...photos].sort((a, b) => {
            if(!a.dateObj && !b.dateObj) return 0;
            if(!a.dateObj) return 1;
            if(!b.dateObj) return -1;
            return sortMode === 'asc' ? a.dateObj - b.dateObj : b.dateObj - a.dateObj;
        });
        
        sorted.forEach(photo => {
            const div = document.createElement('div');
            div.className = 'photo-item';
            const noteHtml = photo.note ? `<div class="photo-note">${photo.note}</div>` : '';
            div.innerHTML = `
                <div class="photo-loading" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:0.8rem;">加载中...</div>
                <div class="photo-tag">${photo.tag}</div>
                <div class="photo-time">${formatExifDate(photo.exifDate) || '未知日期'}</div>
                ${noteHtml}
            `;
            Promise.resolve(photo.file).then(url => {
                const loading = div.querySelector('.photo-loading');
                if(loading) loading.remove();
                const img = document.createElement('img');
                img.src = url;
                img.alt = photo.tag;
                img.loading = 'lazy';
                img.onerror = () => {
                    img.remove();
                    const fail = document.createElement('div');
                    fail.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.4);font-size:0.8rem;text-align:center;padding:1rem;';
                    fail.textContent = '📷 ' + photo.tag;
                    div.insertBefore(fail, div.firstChild);
                };
                div.insertBefore(img, div.firstChild);
                photo.displayUrl = url;
            }).catch(() => {
                const loading = div.querySelector('.photo-loading');
                if(loading) {
                    loading.textContent = '📷 ' + photo.tag;
                    loading.style.color = 'rgba(255,255,255,0.4)';
                }
            });
            div.addEventListener('click', () => showPhotoDetail(photo));
            container.appendChild(div);
        });
    }
    
    function showPhotoDetail(photo) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;animation:fadeIn 0.3s ease;cursor:pointer;';
        
        const displaySrc = photo.displayUrl || photo.file;
        const img = document.createElement('img');
        img.src = displaySrc;
        img.style.cssText = 'max-width:95vw;max-height:90vh;object-fit:contain;border-radius:4px;';
        img.onclick = (e) => {
            e.stopPropagation();
            if(!document.fullscreenElement) {
                img.requestFullscreen().catch(() => {});
            }
        };
        overlay.appendChild(img);
        
        const info = document.createElement('div');
        info.style.cssText = 'position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;';
        info.innerHTML = `<div style="background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);padding:8px 20px;border-radius:20px;"><span style="color:#feca57;font-size:0.95rem;">${formatExifDate(photo.exifDate) || '未知日期'}</span> <span style="color:rgba(255,255,255,0.8);font-size:0.85rem;">${photo.tag}</span></div>`;
        overlay.appendChild(info);
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = 'position:absolute;top:1rem;right:1.5rem;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:1.8rem;width:40px;height:40px;border-radius:50%;cursor:pointer;line-height:1;transition:background 0.2s;';
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.15)';
        overlay.appendChild(closeBtn);
        
        const close = () => { if(document.fullscreenElement) document.exitFullscreen(); overlay.remove(); };
        overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
        closeBtn.addEventListener('click', close);
        document.addEventListener('keydown', function escHandler(e) {
            if(e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
        });
        
        document.body.appendChild(overlay);
        playSound('click');
    }
    
    // 绑定排序下拉菜单
    const sortSelect = document.getElementById('photo-sort');
    if(sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortMode = sortSelect.value;
            renderPhotos();
        });
    }
}

// --- 视频集锦模块 ---
function initVideos() {
    const container = document.getElementById('video-wall');
    if(!container) return;
    
    const videos = [
        { file: '94cb525eb7478052ffe5f0ac08fbe0c2.mp4', label: '青春回忆' }
    ];
    
    videos.forEach(v => {
        const div = document.createElement('div');
        div.className = 'video-item';
        div.innerHTML = `
            <video src="${v.file}" preload="metadata" muted></video>
            <div class="video-play"></div>
            <div class="video-label">${v.label}</div>
        `;
        
        // 悬停预览
        const vid = div.querySelector('video');
        div.addEventListener('mouseenter', () => { vid.play().catch(()=>{}); });
        div.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
        
        // 点击全屏播放
        div.addEventListener('click', () => {
            const overlay = document.createElement('div');
            overlay.className = 'video-overlay';
            overlay.innerHTML = `
                <video src="${v.file}" controls autoplay style="max-width:90vw;max-height:85vh;border-radius:8px;"></video>
                <button class="close-btn">×</button>
            `;
            const closeBtn = overlay.querySelector('.close-btn');
            const videoEl = overlay.querySelector('video');
            const close = () => { videoEl.pause(); overlay.remove(); };
            closeBtn.addEventListener('click', close);
            overlay.addEventListener('click', (e) => { if(e.target === overlay) close(); });
            document.addEventListener('keydown', function escHandler(e) {
                if(e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
            });
            document.body.appendChild(overlay);
            playSound('click');
        });
        
        container.appendChild(div);
    });
}

// --- 模块 4: 课堂经典语录 ---
const quotesData = [
    { text: "化学反应有可逆的，但青春没有。珍惜现在。", author: "化学老师", ctx: "百日誓师大会" },
    { text: "动笔动笔，不要只看。", author: "化学老师", ctx: "课堂日常" },
    { text: "我头发都能想出来。", author: "化学老师", ctx: "解题思路启发" },
    { text: "别瞎搞！", author: "化学老师", ctx: "实验/作业点评" },
    { text: "别睡了别睡了！", author: "化学老师", ctx: "下午第一节课" },
    { text: "e吒！", author: "克克", ctx: "课堂经典口头禅" },
    { text: "你们这是什么操作呀？", author: "Vivien", ctx: "英语课" }
];

function initQuotes() {
    const container = document.getElementById('quotes-container');
    if(!container) return;
    
    quotesData.forEach(q => {
        const card = document.createElement('div');
        card.className = 'quote-card glass-panel';
        card.innerHTML = `
            <div class="quote-text">"${q.text}"</div>
            <div class="quote-author">— ${q.author}</div>
        `;
        card.addEventListener('click', () => {
            card.classList.toggle('active');
        });
        container.appendChild(card);
    });
}

// --- 模块 6: 特殊意义化学方程式 ---
const eqData = [
    { math: "2H₂ + O₂ → 2H₂O", desc: "氢与氧的结合生成水，就像我们和班主任的相遇，平凡却不可或缺。" },
    { math: "C + O₂ → CO₂", desc: "燃烧自己，点亮我们——这是您作为催化剂的使命。" },
    { math: "ΔG = ΔH - TΔS", desc: "反应的自发性取决于焓变和熵变，而我们的相遇，是一场自发且不可逆的反应。" }
];

function initEquations() {
    const container = document.getElementById('equations-container');
    if(!container) return;
    
    eqData.forEach((eq, index) => {
        const item = document.createElement('div');
        item.className = 'equation-item glass-panel';
        // 存储索引用于交错延迟
        item.style.transitionDelay = `${index * 0.15}s`;
        item.innerHTML = `
            <canvas class="equation-particles" data-eq-canvas></canvas>
            <div class="equation-math">${eq.math}</div>
            <div class="equation-desc">${eq.desc}</div>
        `;
        container.appendChild(item);
    });

    // 滚动触发连锁动画
    const items = container.querySelectorAll('.equation-item');
    const eqObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const mathEl = item.querySelector('.equation-math');
                const descEl = item.querySelector('.equation-desc');
                const canvas = item.querySelector('[data-eq-canvas]');
                
                // 防止重复触发
                if (item.classList.contains('visible')) return;
                item.classList.add('visible');
                
                // 启动增强粒子动画（爆发入场 + 化学键连线）
                if (canvas) startEquationParticles(canvas, item);
                
                // 打字机动画
                const fullText = mathEl.textContent;
                mathEl.textContent = '';
                mathEl.classList.add('typing');
                let charIdx = 0;
                const typeSpeed = 70;
                const typeInterval = setInterval(() => {
                    if (charIdx < fullText.length) {
                        mathEl.textContent += fullText[charIdx];
                        charIdx++;
                    } else {
                        clearInterval(typeInterval);
                        mathEl.classList.remove('typing');
                        
                        // 打字完成连锁：发光脉冲 + 扫光 + 卡片呼吸
                        mathEl.classList.add('done');
                        item.classList.add('glow-sweep');
                        setTimeout(() => item.classList.add('pulse'), 300);
                        
                        // 描述文字逐字揭示
                        revealDescChars(descEl);
                        
                        // 清理扫光类
                        setTimeout(() => item.classList.remove('glow-sweep'), 1500);
                    }
                }, typeSpeed);
                
                eqObserver.unobserve(item);
            }
        });
    }, { threshold: 0.3 });

    items.forEach(item => eqObserver.observe(item));
}

/**
 * 描述文字逐字揭示动画：每个字符依次淡入上移
 */
function revealDescChars(el) {
    if (!el) return;
    const text = el.textContent;
    el.textContent = '';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    
    // 将每个字符包装为 span
    const chars = [];
    for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.className = 'desc-char';
        span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
        el.appendChild(span);
        chars.push(span);
    }
    
    // 逐字揭示，每字间隔 35ms
    chars.forEach((span, i) => {
        setTimeout(() => span.classList.add('revealed'), i * 35);
    });
}

/**
 * 方程式粒子动画：爆发入场 + 布朗运动 + 化学键连线
 */
function startEquationParticles(canvas, container) {
    const ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const particles = [];
    const colors = ['rgba(0,229,255,0.5)', 'rgba(0,230,118,0.5)', 'rgba(255,255,255,0.4)', 'rgba(156,39,176,0.4)'];
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    
    // 初始化粒子：从中心爆发
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 2.5;
        particles.push({
            x: cx,
            y: cy,
            // 爆发初速度（向外辐射）
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            targetX: Math.random() * rect.width,
            targetY: Math.random() * rect.height,
            size: Math.random() * 3 + 1.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            phase: 'burst', // burst -> drift
            phaseTime: 0
        });
    }

    let animId;
    let frame = 0;
    const bondDist = 80; // 化学键连线阈值
    
    function animate() {
        ctx.clearRect(0, 0, rect.width, rect.height);
        frame++;
        
        // 绘制化学键连线（分子结构感）
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bondDist) {
                    const alpha = (1 - dist / bondDist) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        
        particles.forEach(p => {
            p.phaseTime++;
            
            if (p.phase === 'burst') {
                // 爆发阶段：快速向外扩散，逐渐减速
                p.vx *= 0.95;
                p.vy *= 0.95;
                if (p.phaseTime > 40) {
                    p.phase = 'drift';
                }
            } else {
                // 布朗运动阶段
                p.vx += (Math.random() - 0.5) * 0.08;
                p.vy += (Math.random() - 0.5) * 0.08;
                p.vx *= 0.98;
                p.vy *= 0.98;
            }
            
            p.x += p.vx;
            p.y += p.vy;
            
            // 边界反弹
            if (p.x < 0 || p.x > rect.width) p.vx *= -1;
            if (p.y < 0 || p.y > rect.height) p.vy *= -1;
            p.x = Math.max(0, Math.min(rect.width, p.x));
            p.y = Math.max(0, Math.min(rect.height, p.y));
            
            // 绘制粒子（带脉动大小）
            const pulse = Math.sin(frame * 0.03 + p.x * 0.01) * 0.3;
            const drawSize = p.size + pulse;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            // 辉光
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawSize * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace('0.5', '0.06').replace('0.4', '0.04');
            ctx.fill();
        });
        
        animId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // 存储动画 ID 以便清理
    container._eqAnimId = animId;
}

// --- 模块 7: 信封动画 ---
function initEnvelope() {
    const envelope = document.getElementById('envelope');
    if(!envelope) return;
    
    envelope.addEventListener('click', () => {
        if(!envelope.classList.contains('open')) {
            envelope.classList.add('open');
            playSound('success');
        } else {
            envelope.classList.remove('open');
        }
    });
}

// --- 全局工具函数：Toast 提示 ---
function showToast(text, duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const msg = document.createElement('div');
    msg.className = 'toast-msg';
    msg.innerText = text;
    container.appendChild(msg);
    
    if (duration > 0) {
        setTimeout(() => {
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 300);
        }, duration);
    }
    return msg;
}

// --- 烟花资源预加载机制 ---
const fireworkAssets = {
    textData: {},
    isPreloaded: false
};

function preloadFireworksAssets() {
    if (fireworkAssets.isPreloaded) return;
    const texts = ["毕业快乐", "学海无涯"];
    const offCanvas = document.createElement('canvas');
    // willReadFrequently 优化连续的 getImageData 性能
    const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
    offCanvas.width = 400;
    offCanvas.height = 150;

    texts.forEach(txt => {
        ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        ctx.font = "bold 60px 'Noto Serif SC', serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(txt, offCanvas.width / 2, offCanvas.height / 2);

        const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
        const points = [];
        
        // 采样像素点生成粒子坐标
        for (let y = 0; y < offCanvas.height; y += 4) {
            for (let x = 0; x < offCanvas.width; x += 4) {
                const alpha = imgData[(y * offCanvas.width + x) * 4 + 3];
                if (alpha > 128) {
                    points.push({ 
                        x: x - offCanvas.width / 2, 
                        y: y - offCanvas.height / 2 
                    });
                }
            }
        }
        fireworkAssets.textData[txt] = points;
    });
    fireworkAssets.isPreloaded = true;
}

// --- 模块 8: 电子请假条签名 ---
function initSignature() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    // 处理高分屏清晰度
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    function startDraw(e) {
        isDrawing = true;
        draw(e);
    }

    function stopDraw() {
        isDrawing = false;
        ctx.beginPath();
    }

    function draw(e) {
        if (!isDrawing) return;
        const x = e.offsetX || (e.touches && e.touches[0].clientX - rect.left);
        const y = e.offsetY || (e.touches && e.touches[0].clientY - rect.top);
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);

    // 触摸支持
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDraw);

    document.getElementById('clear-signature').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('approve-leave').addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        playSound('click');
        
        // 1. 弹出持续显示的 Toast
        const pendingToast = showToast("政教处审批中", 0);
        
        // 2. 在后台静默预加载烟花需要的像素点数据
        preloadFireworksAssets();
        
        // 3. 生成 10~25 秒之间的随机延迟，严格边界校验
        let delay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
        if (delay < 10000) delay = 10000;
        if (delay > 25000) delay = 25000;

        setTimeout(() => {
            // 关闭审批中提示
            pendingToast.style.opacity = '0';
            setTimeout(() => pendingToast.remove(), 300);
            
            // 弹出完成提示并触发特效
            showToast("审批已完成", 4000);
            playSound('success');
            triggerAdvancedFireworksFX();
            
            // 恢复按钮可点状态
            this.disabled = false;
        }, delay);
    });
}

// --- 模块 5: 留言墙 ---
function initMessages() {
    const container = document.getElementById('messages-container');
    if(!container) return;

    const renderMessages = () => {
        const msgs = JSON.parse(localStorage.getItem('class7_msgs') || '[]');
        container.innerHTML = '';
        msgs.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'message-card glass-panel';
            const firstChar = msg.name.charAt(0).toUpperCase();
            card.innerHTML = `
                <div class="message-header">
                    <div class="avatar">${firstChar}</div>
                    <div>
                        <strong>${msg.name}</strong>
                        <div class="message-time">${msg.time}</div>
                    </div>
                </div>
                <div class="message-content">${msg.content}</div>
            `;
            container.appendChild(card);
        });
    };

    // 初始化默认留言（每次启动同步最新数据）
    localStorage.setItem('class7_msgs', JSON.stringify([
            { name: "大嘴", content: "哈喽啊老师，三年的时间很快，很高兴这三年都能成为你的学生，毕业啦，别太想我们，小利同学也是时候享受这快三个月的假期啦，希望老师每天都开开心心的拥有狂吃不胖的能力，老师我没发现你有眼袋，还有我是大嘴！天天开心！事事顺意！", time: "2026年6月" },
            { name: "石", content: "一桌一讲台，一师一生情。感谢若大的宇宙，以渺小的概率让我遇见您。您是最可爱的班主任，感谢成为我们的小利同学，愿今后常联系，七班最棒！", time: "2026年6月" },
            { name: "DJ", content: "三年时光不仅有我走过的痕迹也有您陪伴的身影，\"毕业\"不是我的结束，而是你我新的开始。愿我最喜欢的小利老师桃李满天下，纵横化学教育界无敌手[呲牙]", time: "2026年6月" },
            { name: "土豆", content: "小利同学别忘了我们的海底捞。", time: "2026年6月" },
            { name: "tt", content: "爱你，一辈子。", time: "2026年6月" },
            { name: "御魂(杨惠)", content: "To最爱的小利老师[呲牙]\n很荣幸能够遇到你，因为你，让我见识到化学的神奇，让其成为我最拿手的科目[阴险]，这个高中我们很有缘分呀，三年的化学老师都是你，并且也是我二年的班主任。因为有你在，我们7班变得非常的快乐幸福，你总是给我们准备很多小惊喜，铸就了我高中很多美好的回忆🥰嘻嘻，作为老师你的第1届白月光学生，老师你一定不要忘了我们。\n希望老师以后的事业能越来越好，桃李满天下，遇到更多可爱的同学。", time: "2026年6月" },
            { name: "陈思晗", content: "小利同学，谢谢你成为了我们的老师，其实我喜欢的不是化学，而是教化学的你呢。感谢你每次的鼓励还有问问题时耐心的解答，让一个对化学丝毫不敢兴趣的人有了学化学的动力。看到毕业后在群里和我们聊天的你，才真正感觉我们是朋友，没有了师生的隔阂。祝你身体健康，工作顺利。我们有机会会回来看你的，不要太想我们了呦！", time: "2026年6月" },
            { name: "管蕊蕊", content: "高中最幸福的事是你成为我的班主任！", time: "2026年6月" },
            { name: "王心萍", content: "老师我会想你的。", time: "2026年6月" },
            { name: "吴伊宸", content: "最好的你碰到了最好的我们。", time: "2026年6月" },
            { name: "蔡宇晗", content: "谢谢您3年以来的陪伴，受益匪浅。祝桃李芬芳，我会回来看你。", time: "2026年6月" },
            { name: "李嘉怡", content: "老师很高兴遇见你。", time: "2026年6月" },
            { name: "学习委员", content: "要开心要向前看，你和七班亦师亦友，不要忘记和我们美好的回忆哦！", time: "2026年6月" },
            { name: "余思慧", content: "谢谢老师的栽培，也感谢老师的关心，祝老师以后天天开心。", time: "2026年6月" },
            { name: "曾亚婷", content: "你是一个很有趣很活泼的girl，是你塑造了我们这个友爱的七班。祝你此后一帆风顺，以后带的小崽子乖一点。", time: "2026年6月" },
            { name: "⭐", content: "埋了一个小彩蛋，快找一找吧，我想说的都在彩蛋里面～", time: "2026年6月" }
    ]));

    renderMessages();
}

// --- 喷泉→烟花华丽转场动画 ---
function playTransitionToFireworks() {
    playSound('success');

    // 创建全屏转场覆盖层
    const overlay = document.createElement('div');
    overlay.className = 'fountain-to-fireworks';

    // 金色辉光爆发
    const glowBurst = document.createElement('div');
    glowBurst.className = 'glow-burst';
    overlay.appendChild(glowBurst);

    // 白色闪光
    const whiteFlash = document.createElement('div');
    whiteFlash.className = 'white-flash';
    overlay.appendChild(whiteFlash);

    // 转场文字
    const text = document.createElement('div');
    text.className = 'transition-text';
    text.textContent = '青春的烟花，为毕业而绽放';
    overlay.appendChild(text);

    document.body.appendChild(overlay);

    // 在闪光峰值时激活烟花屏幕
    setTimeout(() => {
        triggerAdvancedFireworksFX();
    }, 1600);

    // 转场动画结束后清除覆盖层
    setTimeout(() => {
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
    }, 3000);
}

// --- 模块 12: 毕业全屏特效 (进阶版多形态烟花) ---
let fireworksAnimating = false;
let fireworksStopRequested = false;
function triggerAdvancedFireworksFX(customDuration) {
    const screen = document.getElementById('fireworks-screen');
    const canvas = document.getElementById('graduation-fx');
    if(!canvas || !screen) return;

    // 显示独立烟花界面
    screen.classList.add('active');
    fireworksAnimating = true;
    fireworksStopRequested = false;
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const particles = [];
    const rockets = [];
    const meteors = [];
    
    const colors = ['#ff4e50', '#f9d423', '#00e5ff', '#00e676', '#ff9ff3', '#feca57', '#ffffff', '#ff6b9d', '#c56cf0', '#5f27cd', '#48dbfb', '#ff9f43', '#10ac84', '#ee5253'];
    
    // 预计算五角星轮廓比例
    function getStarPoints() {
        const pts = [];
        for(let i=0; i<10; i++) {
            const r = i % 2 === 0 ? 1 : 0.4;
            const angle = i * Math.PI / 5 - Math.PI / 2;
            pts.push({x: Math.cos(angle)*r, y: Math.sin(angle)*r});
        }
        return pts;
    }
    const starTemplate = getStarPoints();

    function createParticle(x, y, vx, vy, color, life=1, size=2) {
        particles.push({x, y, vx, vy, color, life, size, decay: Math.random()*0.015 + 0.015});
    }
    
    // 爆炸逻辑：分发不同类型的烟花
    function explode(x, y, color, type, sizeMult = 1) {
        const num = 80;
        if (type === 'circle') {
            // 常规圆形
            for(let i=0; i<num; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * 5 + 2) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color);
            }
        } else if (type === 'ring') {
            // 空心环形
            for(let i=0; i<num; i++) {
                const angle = (i / num) * Math.PI * 2;
                const speed = 6 * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color);
            }
        } else if (type === 'fan') {
            // 扇形向上爆炸
            for(let i=0; i<num; i++) {
                const angle = -Math.random() * Math.PI; // 向上180度
                const speed = (Math.random() * 6 + 2) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color);
            }
        } else if (type === 'star') {
            // 星型烟花
            for(let i=0; i<10; i++) {
                const p1 = starTemplate[i];
                const p2 = starTemplate[(i+1)%10];
                for(let j=0; j<10; j++) {
                    const t = j/10;
                    const px = p1.x * (1-t) + p2.x * t;
                    const py = p1.y * (1-t) + p2.y * t;
                    const speed = 8 * sizeMult;
                    // 加上极轻微扰动让烟花更自然
                    createParticle(x, y, px * speed + (Math.random()-0.5), py * speed + (Math.random()-0.5), color, 1.2, 3);
                }
            }
        } else if (type === 'text_happy' || type === 'text_study') {
            // 文字烟花
            const textKey = type === 'text_happy' ? "毕业快乐" : "学海无涯";
            const pts = fireworkAssets.textData[textKey];
            if(pts && pts.length > 0) {
                pts.forEach(p => {
                    createParticle(x, y, p.x * 0.05 * sizeMult, p.y * 0.05 * sizeMult, color, 1.5, 2.5);
                });
            } else {
                // 如果预加载异常回退到圆
                explode(x, y, color, 'circle', sizeMult);
            }
        } else if (type === 'heart') {
            // 心形烟花：参数方程 x = 16sin³t, y = 13cos t − 5cos2t − 2cos3t − cos4t
            for(let i=0; i<num; i++) {
                const t = (i / num) * Math.PI * 2;
                const sx = 16 * Math.pow(Math.sin(t), 3);
                const sy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                const speed = 0.35 * sizeMult;
                createParticle(x, y, sx * speed, sy * speed, color, 1.4, 2.2);
            }
        } else if (type === 'spiral') {
            // 螺旋形烟花：粒子沿螺旋线向外散开
            for(let i=0; i<num; i++) {
                const t = (i / num) * Math.PI * 6; // 3 圈螺旋
                const r = (i / num) * 7 + 0.5;
                const speed = r * sizeMult;
                createParticle(x, y, Math.cos(t) * speed, Math.sin(t) * speed, color, 1.2, 2);
            }
        } else if (type === 'doubleRing') {
            // 双层同心环：内外两圈反向运动
            const half = num / 2;
            for(let i=0; i<half; i++) {
                const angle = (i / half) * Math.PI * 2;
                const speed = 6 * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color);
            }
            for(let i=0; i<half; i++) {
                const angle = (i / half) * Math.PI * 2;
                const speed = 3.5 * sizeMult;
                createParticle(x, y, -Math.cos(angle)*speed, -Math.sin(angle)*speed, color);
            }
        } else if (type === 'chrysanthemum') {
            // 菊花形：放射状 + 较长拖尾（粒子生命周期更长、初速更大）
            for(let i=0; i<num; i++) {
                const angle = (i / num) * Math.PI * 2;
                const speed = (Math.random() * 3 + 5) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 1.6, 1.8);
            }
        } else if (type === 'palm') {
            // 棕榈树形：上半圆密集 + 下垂重粒子
            const half = num / 2;
            // 上半圆
            for(let i=0; i<half; i++) {
                const angle = -Math.PI + (i / half) * Math.PI; // -180° 到 0°
                const speed = (Math.random() * 3 + 4) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 1.4, 2);
            }
            // 下垂（重力大的粒子）
            for(let i=0; i<half; i++) {
                const angle = -Math.PI + (i / half) * Math.PI;
                const speed = (Math.random() * 2 + 3) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 1.8, 2.2);
            }
        } else if (type === 'willow') {
            // 柳条形：长拖尾下垂粒子
            for(let i=0; i<num; i++) {
                const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.8;
                const speed = (Math.random() * 2 + 2) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 2.2, 1.6);
            }
        } else if (type === 'crackle') {
            // 闪光爆裂：短距离密集小粒子（模拟爆竹）
            for(let i=0; i<num * 1.5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * 2.5 + 0.5) * sizeMult;
                createParticle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed, color, 0.6, 1.5);
            }
        }
    }
    
    let startTime = Date.now();
    let duration = customDuration || 20000; // 烟花生成持续时间不少于 20 秒，支持自定义传入
    let nextSpawnTime = startTime + 100;
    
    // 烟花类型池：圆形/环形/扇形为常规，额外 6 种特殊形状
    const standardTypes = ['circle', 'ring', 'fan', 'doubleRing'];
    const specialTypes = ['star', 'heart', 'spiral', 'chrysanthemum', 'palm', 'willow', 'crackle'];
    const textTypes = ['text_happy', 'text_study'];
    let textsFired = 0;
    // 满足“至少3种不同尺寸、色彩的星型爆炸烟花”
    let starSizes = [0.8, 1.3, 2.0];
    
    function animate() {
        // 用户主动关闭：立即停止并清空粒子
        if(fireworksStopRequested) {
            particles.length = 0;
            rockets.length = 0;
            meteors.length = 0;
            fireworksAnimating = false;
            return;
        }
        // 拖影效果
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(10, 14, 23, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        
        let now = Date.now();
        let active = false; // 用于判定屏幕上是否还有残留粒子
        
        // 1. 按照自然燃放逻辑，随机间隔释放烟花
        if (now < startTime + duration) {
            if (now > nextSpawnTime) {
                const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
                const targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // 25%概率生成流星雨
                if (Math.random() < 0.25) {
                    meteors.push({
                        x: Math.random() * canvas.width,
                        y: -50,
                        vx: Math.random() * -4 - 2,
                        vy: Math.random() * 5 + 12,
                        color: '#fff',
                        life: 1
                    });
                } else {
                    let type = '';
                    let sizeMult = Math.random() * 0.8 + 0.6;
                    const roll = Math.random();
                    
                    // 控制两组文字烟花必须触发且仅触发一次
                    if (textsFired < 2 && roll < 0.15) {
                        type = textTypes[textsFired];
                        textsFired++;
                        sizeMult = 1.8;
                    } else if (roll < 0.45) {
                        // 30% 概率出特殊形状（心形/螺旋/菊花/棕榈/柳条/爆裂 等 7 种）
                        type = specialTypes[Math.floor(Math.random() * specialTypes.length)];
                        if(type === 'star') {
                            sizeMult = starSizes[Math.floor(Math.random() * starSizes.length)];
                        }
                    } else {
                        // 常规烟花（圆形、环形、扇形、双环）
                        type = standardTypes[Math.floor(Math.random() * standardTypes.length)];
                    }
                    
                    rockets.push({
                        x, y: canvas.height, targetY,
                        vx: (Math.random()-0.5)*3, vy: -Math.random()*4 - 10,
                        color, type, sizeMult
                    });
                }

                // 偶发同时发射 2~3 枚，制造齐发高潮
                if(Math.random() < 0.3) {
                    const burstCount = Math.floor(Math.random() * 2) + 2;
                    for(let b=0; b<burstCount; b++) {
                        const bx = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
                        const btY = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
                        const bcolor = colors[Math.floor(Math.random() * colors.length)];
                        let btype = standardTypes[Math.floor(Math.random() * standardTypes.length)];
                        let bSize = Math.random() * 0.6 + 0.5;
                        rockets.push({
                            x: bx, y: canvas.height, targetY: btY,
                            vx: (Math.random()-0.5)*3, vy: -Math.random()*4 - 10,
                            color: bcolor, type: btype, sizeMult: bSize
                        });
                    }
                }
                
                nextSpawnTime = now + Math.random() * 350 + 120; // 下一枚间隔 120~470ms（更密集）
            }
        }
        
        // 2. 更新流星雨
        for(let i=meteors.length-1; i>=0; i--) {
            let m = meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life -= 0.015;
            active = true;
            
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x - m.vx * 6, m.y - m.vy * 6);
            ctx.strokeStyle = `rgba(255,255,255,${m.life})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            if(m.life <= 0 || m.y > canvas.height) meteors.splice(i, 1);
        }
        
        // 3. 更新火箭升空
        for(let i=rockets.length-1; i>=0; i--) {
            let r = rockets[i];
            r.x += r.vx;
            r.y += r.vy;
            active = true;
            
            ctx.beginPath();
            ctx.arc(r.x, r.y, 2, 0, Math.PI*2);
            ctx.fillStyle = r.color;
            ctx.fill();
            
            // 火箭尾迹
            createParticle(r.x, r.y, 0, 0, r.color, 0.5, 1.5);
            
            if (r.vy >= 0 || r.y <= r.targetY) {
                explode(r.x, r.y, r.color, r.type, r.sizeMult);
                rockets.splice(i, 1);
            }
        }
        
        // 4. 更新爆炸粒子
        for(let i=particles.length-1; i>=0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08; // 重力
            p.vx *= 0.96; // 摩擦力
            p.vy *= 0.96;
            p.life -= p.decay;
            active = true;
            
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            if(p.life <= 0) particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;
        
        // 5. 循环或退出
        if (now < startTime + duration || active) {
            requestAnimationFrame(animate);
        } else {
            // 烟花自然结束，保留界面让用户主动关闭
            fireworksAnimating = false;
        }
    }

    animate();
}

// 关闭烟花全屏界面
function closeFireworksScreen() {
    fireworksStopRequested = true;
    const screen = document.getElementById('fireworks-screen');
    const canvas = document.getElementById('graduation-fx');
    if(!screen) return;
    screen.classList.remove('active');
    if(canvas) {
        canvas.classList.add('hidden');
        const ctx = canvas.getContext('2d');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// 彩蛋：电影尾幕文字滚动
function triggerCreditsEgg() {
    const creditsEgg = document.getElementById('credits-egg');
    const creditsContent = document.getElementById('credits-content');
    if(!creditsEgg || !creditsContent) return;
    
    // 彩蛋文本内容
    const text = `小利老师：

这次真不是AI写的。

三年转眼就过，以后你早上醒来，看不见我们这群人了，可别太想啊。

能当您的学生，我很幸运。这两年，有开心，有难过，有生气，也有累的时候。谢谢你在我低落的时候给我鼓励，让我还能撑下去读书；在我迷茫的时候拉着我走了一段，帮我找到方向。你就像个大姐姐一样。

还记得高二那次，你把我叫到办公室分析试卷。那张卷子我其实已经忘了考了多少分，但好像就是从那天起，化学突然变得有意思了。后来有一次考了班级第一，我当时挺高兴的，但更高兴的是——之后成绩虽然普普通通，可我对化学的那点兴趣，一直没灭过。

这两年也给你添了不少麻烦，你都耐心地一点点帮我改过来。我都记得，会记很久很久。

CMJ那件事，其实还有很多没跟你说。我怕一直闹下去没完没了，可你又一直想帮我们解决，而他死活不认。后来我想，算了，不折腾了。

还有一件小事。你在私聊里好几次说我拍的照丑，我总不知道怎么回，就发个表情糊弄过去。现在我终于想明白了：也许拍下来的照片不算完美，但每一张都有它的意义——那一瞬间的记忆，是无价的。摄影不只是技术，也是生活本身。所以，勇敢去拍吧。

对了，这件事您其实是知道的。咱们班的百度网盘一直是我在管，快70个G了，全存在我自己的账号里。但我从来没觉得亏，因为那里面装的是我们这三年的日常照片和活动照片，一张一张攒下来的。这些东西放在网盘里就是一堆数据，但我知道，那是我们一群人回不去的三年。都是无价之宝。

我一直很喜欢雷军说的一句话——永远相信美好的事情即将发生。

希望你以后少熬夜，少操心，多笑笑。

山水有相逢，来日皆可期。

敬颂时绥。

小利姐，我们下次见。`;
    
    // 将文本按段落分割
    const paragraphs = text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    creditsContent.innerHTML = paragraphs + '<p class="heart">♥</p>';
    
    creditsEgg.classList.remove('hidden');
    creditsEgg.scrollTop = 0;
    
    // 添加关闭按钮
    let closeBtn = creditsEgg.querySelector('.close-credits');
    if(!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.className = 'close-credits';
        closeBtn.innerHTML = '×';
        creditsEgg.appendChild(closeBtn);
    }
    closeBtn.onclick = () => {
        stopAutoScroll();
        creditsEgg.classList.add('hidden');
    };
    
    // --- 自动滚动 + 手动控制 ---
    let scrollRAF = null;
    let autoScrollActive = true;
    let resumeTimer = null;
    const SCROLL_SPEED = 0.6; // px/frame，舒缓速度
    
    /** 自动滚动循环 */
    function autoScroll() {
        if (!autoScrollActive || creditsEgg.classList.contains('hidden')) return;
        const maxScroll = creditsEgg.scrollHeight - creditsEgg.clientHeight;
        if (creditsEgg.scrollTop < maxScroll - 2) {
            creditsEgg.scrollTop += SCROLL_SPEED;
        }
        scrollRAF = requestAnimationFrame(autoScroll);
    }
    
    /** 停止自动滚动 */
    function stopAutoScroll() {
        autoScrollActive = false;
        if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
    }
    
    /** 恢复自动滚动（即时） */
    function resumeAutoScroll() {
        clearTimeout(resumeTimer);
        if (!autoScrollActive && !creditsEgg.classList.contains('hidden')) {
            autoScrollActive = true;
            scrollRAF = requestAnimationFrame(autoScroll);
        }
    }
    
    /** 暂停并延迟恢复 */
    function pauseAndResume(delay) {
        stopAutoScroll();
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(resumeAutoScroll, delay || 800);
    }
    
    // --- 鼠标滚轮：原生滚动 + 暂停自动滚动 ---
    creditsEgg.addEventListener('wheel', () => {
        pauseAndResume(1200);
    }, { passive: true });
    
    // --- 触摸拖拽：手指控制位置 ---
    let touchStartY = 0;
    let touchLastY = 0;
    creditsEgg.addEventListener('touchstart', (e) => {
        stopAutoScroll();
        clearTimeout(resumeTimer);
        touchStartY = e.touches[0].clientY;
        touchLastY = touchStartY;
    }, { passive: true });
    
    creditsEgg.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const delta = touchLastY - currentY;
        creditsEgg.scrollTop += delta;
        touchLastY = currentY;
    }, { passive: true });
    
    creditsEgg.addEventListener('touchend', () => {
        resumeAutoScroll();
    }, { passive: true });
    
    // --- 鼠标拖拽：桌面端拖拽控制 ---
    let mouseDragging = false;
    let mouseLastY = 0;
    creditsEgg.addEventListener('mousedown', (e) => {
        if (e.target === closeBtn || e.target.closest('.close-credits')) return;
        mouseDragging = true;
        mouseLastY = e.clientY;
        stopAutoScroll();
        clearTimeout(resumeTimer);
        creditsEgg.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!mouseDragging) return;
        const delta = mouseLastY - e.clientY;
        creditsEgg.scrollTop += delta;
        mouseLastY = e.clientY;
    });
    
    document.addEventListener('mouseup', () => {
        if (!mouseDragging) return;
        mouseDragging = false;
        creditsEgg.style.cursor = '';
        resumeAutoScroll();
    });
    
    // 延迟1秒开始自动滚动
    setTimeout(() => {
        if (!creditsEgg.classList.contains('hidden')) {
            autoScrollActive = true;
            scrollRAF = requestAnimationFrame(autoScroll);
        }
    }, 1000);
}

// --- 交互式动态 Canvas 背景 (使用化学式替代圆点) ---
function initInteractiveBg() {
    const canvas = document.getElementById('interactive-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // 优化性能，不需要透明通道
    
    let width, height;
    let particles = [];
    
    // 鼠标交互状态
    const mouse = { x: -1000, y: -1000, radius: 250 };
    
    // 化学式池
    const formulaTexts = ['C₆H₁₂O₆', 'NaOH', 'HCl', 'CO₂', 'H₂SO₄', 'NaCl', 'H₂O', 'Fe₂O₃', 'CaCO₃', 'O₂'];
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles();
    }
    
    window.addEventListener('resize', () => {
        // 使用节流避免频繁触发
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(resize, 200);
    }, { passive: true });
    
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });
    
    document.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    }, { passive: true });
    
    class FormulaParticle {
        constructor(isDot = false) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.isDot = isDot;
            
            if (this.isDot) {
                this.size = Math.random() * 2 + 0.5;
            } else {
                this.fontSize = Math.random() * 12 + 10;
                this.text = formulaTexts[Math.floor(Math.random() * formulaTexts.length)];
            }
            
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 20) + 1;
            
            // 为文字/斑点配置颜色和透明度 (模拟冷暖色调)
            const isWarm = Math.random() > 0.5;
            this.color = isWarm ? `rgba(255, ${Math.floor(Math.random()*100 + 100)}, ${Math.floor(Math.random()*50)}, ${Math.random()*0.4 + 0.1})` 
                                : `rgba(${Math.floor(Math.random()*50)}, ${Math.floor(Math.random()*150 + 100)}, 255, ${Math.random()*0.4 + 0.1})`;
        }
        
        draw() {
            if (this.isDot) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            } else {
                ctx.font = `${this.fontSize}px "Times New Roman", serif`;
                ctx.fillStyle = this.color;
                ctx.fillText(this.text, this.x, this.y);
            }
        }
        
        update() {
            // 缓慢漂浮
            this.baseY -= 0.15;
            if (this.baseY < -50) {
                this.baseY = height + 50;
                this.baseX = Math.random() * width;
            }
            
            // 鼠标排斥逻辑
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let maxDistance = mouse.radius;
            let force = (maxDistance - distance) / maxDistance;
            let directionX = forceDirectionX * force * this.density;
            let directionY = forceDirectionY * force * this.density;
            
            if (distance < mouse.radius) {
                this.x -= directionX * 2;
                this.y -= directionY * 2;
            } else {
                if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx / 30;
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY;
                    this.y -= dy / 30;
                }
            }
            this.draw();
        }
    }
    
    function initParticles() {
        particles = [];
        // 化学式数量
        const formulaCount = Math.min(Math.max(Math.floor((width * height) / 25000), 40), 100);
        for (let i = 0; i < formulaCount; i++) {
            particles.push(new FormulaParticle(false));
        }
        
        // 斑点(圆点)数量，作为星空点缀，数量可以多一些
        const dotCount = Math.min(Math.floor((width * height) / 10000), 150);
        for (let i = 0; i < dotCount; i++) {
            particles.push(new FormulaParticle(true));
        }
    }
    
    // 动态渐变背景颜色配置库
    const colorPalettes = [
        { name: 'Aurora', colors: [[18, 53, 68], [45, 22, 84], [68, 55, 18], [0, 45, 60]] },
        { name: 'Sunset', colors: [[68, 25, 20], [84, 45, 30], [55, 15, 45], [70, 30, 20]] },
        { name: 'Ocean', colors: [[10, 30, 60], [20, 50, 80], [15, 70, 60], [10, 40, 70]] },
        { name: 'Nebula', colors: [[30, 15, 60], [15, 45, 70], [60, 20, 50], [25, 20, 65]] }
    ];
    let currentPaletteIdx = 0;
    let nextPaletteIdx = 0;
    let paletteTransition = 0; // 0 to 1

    // 性能适配：可配置的帧率开关
    const isLowEndDevice = window.innerWidth < 768 || navigator.hardwareConcurrency < 4;
    const skipFrames = isLowEndDevice ? 1 : 0; // 低端设备每隔1帧渲染一次背景
    let frameCount = 0;

    // 预留的动画控制开关
    window.bgAnimationEnabled = true;

    // 颜色插值函数
    function lerpColor(c1, c2, t) {
        return [
            Math.round(c1[0] + (c2[0] - c1[0]) * t),
            Math.round(c1[1] + (c2[1] - c1[1]) * t),
            Math.round(c1[2] + (c2[2] - c1[2]) * t)
        ];
    }

    // 定期切换调色板
    setInterval(() => {
        if (!window.bgAnimationEnabled) return;
        nextPaletteIdx = (currentPaletteIdx + 1) % colorPalettes.length;
        paletteTransition = 0;
    }, 15000); // 每 15 秒切换一次主题色

    // 绘制高级渐变背景
    function drawBackground() {
        if (!window.bgAnimationEnabled) return;
        
        frameCount++;
        if (frameCount % (skipFrames + 1) !== 0) return; // 性能节流

        // 更新调色板过渡
        if (paletteTransition < 1) {
            paletteTransition += 0.002; // 平滑过渡速度
            if (paletteTransition >= 1) {
                paletteTransition = 1;
                currentPaletteIdx = nextPaletteIdx;
            }
        }

        const p1 = colorPalettes[currentPaletteIdx].colors;
        const p2 = colorPalettes[nextPaletteIdx].colors;
        
        // 获取当前混合后的4个主色
        const c1 = lerpColor(p1[0], p2[0], paletteTransition);
        const c2 = lerpColor(p1[1], p2[1], paletteTransition);
        const c3 = lerpColor(p1[2], p2[2], paletteTransition);
        const c4 = lerpColor(p1[3], p2[3], paletteTransition);

        // 深空基底，带有极其缓慢的颜色呼吸
        const baseTime = Date.now() * 0.0001;
        const baseColor = `rgb(${10 + Math.sin(baseTime)*5}, ${14 + Math.cos(baseTime)*5}, ${23 + Math.sin(baseTime*0.8)*5})`;
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, width, height);

        // 绘制几个大的柔和渐变光晕
        const drawGlow = (x, y, r, colorArray, a) => {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, `rgba(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]}, ${a})`);
            grad.addColorStop(1, `rgba(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]}, 0)`);
            
            // 使用 source-over 进行柔和叠加
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';
        };

        // 基于时间缓慢移动的光晕 (时间系数调小，让节奏更舒缓)
        const time = Date.now() * 0.00015; // 舒缓的节奏
        
        // 节点1：左上区域游荡
        drawGlow(
            width * 0.2 + Math.sin(time) * (width * 0.15), 
            height * 0.3 + Math.cos(time * 0.8) * (height * 0.15), 
            width * 0.6, 
            c1, 
            0.45
        ); 
        
        // 节点2：右侧区域游荡
        drawGlow(
            width * 0.8 + Math.cos(time * 0.7) * (width * 0.15), 
            height * 0.6 + Math.sin(time * 0.9) * (height * 0.2), 
            width * 0.7, 
            c2, 
            0.4
        ); 
        
        // 节点3：底部区域游荡
        drawGlow(
            width * 0.5 + Math.sin(time * 0.6) * (width * 0.25), 
            height * 0.9 + Math.cos(time * 0.5) * (height * 0.1), 
            width * 0.65, 
            c3, 
            0.35
        );
        
        // 节点4：跟随滚动条位置或缓慢对角线运动的补光
        const scrollY = window.scrollY || 0;
        const scrollFactor = Math.min(scrollY / 1000, 1);
        drawGlow(
            width * 0.1 + (width * 0.8 * scrollFactor) + Math.cos(time) * 100, 
            height * 0.8 - (height * 0.6 * scrollFactor) + Math.sin(time) * 100, 
            width * 0.5, 
            c4, 
            0.3
        );

        // 鼠标位置的微弱跟随高光
        if (mouse.x > 0 && !isLowEndDevice) {
            drawGlow(mouse.x, mouse.y, 400, [0, 229, 255], 0.08);
        }
    }
    
    function animate() {
        drawBackground();
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        requestAnimationFrame(animate);
    }
    
    resize();
    animate();
}

// --- 滚动导航侧边栏 ---
function initScrollNav() {
    const nav = document.getElementById('scroll-nav');
    if (!nav) return;

    const dots = nav.querySelectorAll('.scroll-nav-dot');
    const sectionIds = Array.from(dots).map(d => d.getAttribute('href').slice(1));

    // 点击跳转（平滑滚动）
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(dot.getAttribute('href').slice(1));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 滚动时自动高亮当前模块
    let ticking = false;
    function updateActiveDot() {
        const scrollY = window.scrollY + window.innerHeight * 0.35;
        let activeIdx = 0;

        for (let i = sectionIds.length - 1; i >= 0; i--) {
            const section = document.getElementById(sectionIds[i]);
            if (section && section.offsetTop <= scrollY) {
                activeIdx = i;
                break;
            }
        }

        dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateActiveDot);
            ticking = true;
        }
    }, { passive: true });

    // 初始状态
    updateActiveDot();
}

// --- 初始化所有模块 ---
document.addEventListener('DOMContentLoaded', () => {
    initInteractiveBg();
    // 关闭模态框事件已在上方绑定
    initHero();
    initBeaker();
    initTimeline();
    initPhotoWall();
    initVideos();
    initQuotes();
    initEquations();
    initEnvelope();
    initSignature();
    initMessages();
    initStats();
    observeElements();
    initScrollNav();
    // 绑定烟花界面关闭按钮
    const fwClose = document.getElementById('fireworks-close');
    if(fwClose) {
        fwClose.addEventListener('click', closeFireworksScreen);
    }
    // ESC 键也可关闭
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') {
            const creditsEgg = document.getElementById('credits-egg');
            if(creditsEgg && !creditsEgg.classList.contains('hidden')) {
                creditsEgg.classList.add('hidden');
                return;
            }
            if(document.getElementById('fireworks-screen')?.classList.contains('active')) {
                closeFireworksScreen();
            }
        }
    });

    // 彩蛋：按键组合"0401"触发电影尾幕
    let eggCode = '';
    document.addEventListener('keydown', (e) => {
        const screen = document.getElementById('fireworks-screen');
        if(!screen || !screen.classList.contains('active')) return;
        
        eggCode += e.key;
        if(eggCode.length > 4) eggCode = eggCode.slice(-4);
        
        if(eggCode === '0401') {
            eggCode = '';
            triggerCreditsEgg();
        }
    });

    // 彩蛋：烟花界面连续点击屏幕 5 下触发电影尾幕
    let fwClickTimes = [];
    const fwScreen = document.getElementById('fireworks-screen');
    if (fwScreen) {
        fwScreen.addEventListener('click', (e) => {
            // 忽略关闭按钮和彩蛋自身的点击
            if (e.target.closest('.fireworks-close-btn') || e.target.closest('.credits-egg')) return;
            if (!fwScreen.classList.contains('active')) return;

            const now = Date.now();
            // 只保留最近 2 秒内的点击
            fwClickTimes = fwClickTimes.filter(t => now - t < 2000);
            fwClickTimes.push(now);

            if (fwClickTimes.length >= 5) {
                fwClickTimes = [];
                triggerCreditsEgg();
            }
        });
    }
});

// --- 模块: 班级数据看板 ---
function initStats() {
    const daysEl = document.getElementById('stat-days');
    if(daysEl) {
        // 计算从 2024-08-26 到今天的相识天数
        const diff = Date.now() - CONFIG.startDate;
        const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        daysEl.setAttribute('data-target', days);

        // 每天跨过午夜后自动 +1：基于"天索引"判断是否进入新的一天
        let lastDayIndex = Math.floor(Date.now() / 86400000);
        setInterval(() => {
            const currentDayIndex = Math.floor(Date.now() / 86400000);
            if(currentDayIndex !== lastDayIndex) {
                lastDayIndex = currentDayIndex;
                const newDiff = Date.now() - CONFIG.startDate;
                const newDays = Math.max(0, Math.floor(newDiff / (1000 * 60 * 60 * 24)));
                daysEl.setAttribute('data-target', newDays);
                // 动画已结束，直接刷新显示
                daysEl.textContent = newDays;
            }
        }, 1000);
    }

    const statValues = document.querySelectorAll('.stat-value');
    let animated = false;

    const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting && !animated) {
            animated = true;
            statValues.forEach(el => {
                const target = parseFloat(el.getAttribute('data-target'));
                const suffix = el.getAttribute('data-suffix') || '';
                const isDecimal = el.getAttribute('data-target').includes('.');
                const duration = 2000;
                const start = performance.now();

                function update(currentTime) {
                    const elapsed = currentTime - start;
                    const progress = Math.min(elapsed / duration, 1);
                    // easeOutQuart
                    const easeProgress = 1 - Math.pow(1 - progress, 4);
                    const currentVal = target * easeProgress;

                    if(isDecimal) {
                        el.textContent = currentVal.toFixed(1) + suffix;
                    } else {
                        el.textContent = Math.floor(currentVal) + suffix;
                    }

                    if(progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
                    }
                }
                requestAnimationFrame(update);
            });
        }
    }, { threshold: 0.5 });

    const statsModule = document.getElementById('stats-module');
    if(statsModule) {
        observer.observe(statsModule);
    }
}
