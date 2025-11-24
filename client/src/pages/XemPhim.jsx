import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Play, Pause, ArrowLeft, Share2, Volume2, VolumeX, 
  Maximize, Download, SkipBack, SkipForward, Lock 
} from "lucide-react";
import Hls from "hls.js";
import axios from "axios"

const XemPhim = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const VITE_BASE_URL =import.meta.env.VITE_BASE_URL
  // ==========================================
  // 📌 QUY TẮC: TẤT CẢ HOOKS PHẢI Ở ĐÂY
  // KHÔNG BAO GIỜ đặt hooks sau if/return
  // ==========================================

  // States cho video player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // States mới cho access control
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);

  // ==========================================
  // 📌 TẤT CẢ useEffect CŨNG PHẢI Ở ĐÂY
  // ==========================================

  // useEffect 1: Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/video/${id}`);
        setMovie(response.data);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin phim:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin phim");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovie();
    }
  }, [id]);

  // useEffect 2: Check access
  useEffect(() => {
    const checkAccess = async () => {
      if (!id) return;
      
      try {
        setCheckingAccess(true);
        const response = await axios.get(
          `/api/video-purchase/${id}/access`,
          { withCredentials: true }
        );
        
        console.log('✅ Access check:', response.data);
        setHasAccess(response.data.has_access);
        
        if (!response.data.has_access) {
          setShowPurchase(true);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra quyền:', error);
        
        if (error.response?.status === 401) {
          alert('Vui lòng đăng nhập để xem video');
          navigate('/login');
          return;
        }
        
        if (error.response?.status === 404) {
          setError('Video không tồn tại');
          setShowPurchase(false);
          return;
        }
        
        // Lỗi khác - tạm cho xem
        console.warn('Lỗi kiểm tra, cho xem tạm thời');
        setHasAccess(true);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [id, navigate]);

  // useEffect 3: Setup HLS
  useEffect(() => {
    if (!movie || !videoRef.current || !hasAccess) return;
  
    const videoSrc = `${VITE_BASE_URL}api/stream/${movie.s3_folder_name}/master.m3u8`;
  
    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        liveSyncDurationCount: 5,
        maxFragLookUpTolerance: 0.5,
        maxBufferHole: 0.5,
        maxStarvationDelay: 4,
        fetchTimeout: 20_000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });
  
      hls.loadSource(videoSrc);
      hls.attachMedia(videoRef.current);
  
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("✅ HLS manifest loaded");
        setBuffering(false);
      });
  
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("❌ HLS Error:", data);
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && data.details === "bufferStalledError") {
          setBuffering(true);
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR && data.details === "fragLoadTimeOut") {
          setBuffering(true);
          hls.startLoad();
        } else if (data.fatal) {
          setError("Không thể phát video. Vui lòng thử lại sau.");
          setBuffering(false);
        }
      });
  
      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = videoSrc;
      setBuffering(false);
    } else {
      setError("Trình duyệt không hỗ trợ phát video HLS");
      setBuffering(false);
    }
  }, [movie, hasAccess]);

  // useEffect 4: Save progress
  useEffect(() => {
    if (!hasAccess || !id) return;
    
    const saveProgress = async () => {
      if (!videoRef.current) return;
      
      try {
        await axios.post(
          '/api/video-purchase/watch-progress',
          {
            video_id: id,
            last_position: Math.floor(videoRef.current.currentTime),
            watch_duration: Math.floor(videoRef.current.currentTime),
          },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Lỗi lưu tiến độ:', error);
      }
    };

    const interval = setInterval(saveProgress, 30000);
    const handleBeforeUnload = () => saveProgress();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress();
    };
  }, [hasAccess, id]);

  // ==========================================
  // 📌 SAU KHI KHAI BÁO HẾT HOOKS, MỚI ĐỊNH NGHĨA HÀM
  // ==========================================

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        if (!videoRef.current.paused) {
          await videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        if (videoRef.current.paused || videoRef.current.ended) {
          setBuffering(true);
          await videoRef.current.play().catch((err) => {
            if (err.name !== "AbortError") {
              console.error("Play error:", err);
              setError("Không thể phát video.");
            }
          });
          setIsPlaying(true);
          setBuffering(false);
        }
      }
    } catch (err) {
      console.error("Play/pause error:", err);
      setBuffering(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setBuffering(videoRef.current.paused && isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setBuffering(false);
    }
  };
  const handleDownload = async () => {
    if (!movie) return;
    
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const videoUrl = `/api/stream/${movie.s3_folder_name}/master.m3u8`;
      
      // Tải file m3u8 để lấy danh sách segments
      const m3u8Response = await axios.get(videoUrl);
      const m3u8Content = m3u8Response.data;
      
      // Parse để lấy tên file .ts
      const tsFiles = m3u8Content
        .split('\n')
        .filter(line => line.endsWith('.ts'))
        .map(line => line.trim());

      if (tsFiles.length === 0) {
        alert("Không thể tải video. Vui lòng thử lại sau.");
        setDownloading(false);
        return;
      }

      // Tải từng segment
      const segments = [];
      for (let i = 0; i < tsFiles.length; i++) {
        const tsUrl = `/api/stream/${movie.s3_folder_name}/${tsFiles[i]}`;
        const response = await axios.get(tsUrl, {
          responseType: 'blob'
        });
        segments.push(response.data);
        setDownloadProgress(Math.round(((i + 1) / tsFiles.length) * 100));
      }

      // Ghép các segments lại
      const blob = new Blob(segments, { type: 'video/mp2t' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${movie.video_title}.ts`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("Tải xuống thành công!");
    } catch (error) {
      console.error("Lỗi khi tải video:", error);
      alert("Không thể tải video. Vui lòng thử lại sau.");
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };
  const handleProgressClick = (e) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    if (videoRef.current && duration) {
      const newTime = Math.min(currentTime + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // 📌 CUỐI CÙNG MỚI ĐẾN CÁC ĐIỀU KIỆN RENDER
  // ==========================================

  // 1. Đang kiểm tra quyền
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // 2. Cần mua video
  if (showPurchase) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50 rounded-xl p-8 text-center mb-8">
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Video này yêu cầu thanh toán</h2>
            <p className="text-gray-300 mb-6">
              Vui lòng mua hoặc thuê video để xem nội dung
            </p>
            <div className="flex gap-4 justify-center">
              <button
    onClick={() => window.location.href = `/video-purchase/${id}`}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition-all"
              >
                Mua/Thuê ngay
              </button>
              <button
                onClick={() => navigate('/video')}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
              >
                Quay lại
              </button>
            </div>
          </div>

          {movie && (
            <div className="grid md:grid-cols-2 gap-6">
              <img
                src={movie.poster_image_url || '/placeholder-poster.jpg'}
                alt={movie.video_title}
                className="rounded-xl w-full aspect-[2/3] object-cover opacity-50"
              />
              <div>
                <h1 className="text-3xl font-bold mb-4">{movie.video_title}</h1>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-400" />
                    <span>Nội dung bị khóa</span>
                  </div>
                  <p>Để xem video này, bạn cần mua hoặc thuê nội dung.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Đang tải
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300">Đang tải phim...</p>
        </div>
      </div>
    );
  }

  // 4. Có lỗi
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/video")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Quay lại thư viện
          </button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return null;
  }

  // 5. Render video player bình thường
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/video')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại thư viện</span>
          </button>
          <h1 className="text-xl font-bold text-blue-200">{movie.video_title}</h1>
          <button className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Video Player */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative group mb-8">
          <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-900">
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                poster={movie.poster_image_url || "/placeholder-poster.jpg"}
              />

              {/* Buffering Indicator */}
              {buffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-blue-300 text-sm">Đang tải video...</p>
                  </div>
                </div>
              )}

              {/* Play/Pause Overlay */}
              {!isPlaying && !buffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 group-hover:bg-gray-900/60 transition-colors">
                  <button
                    onClick={handlePlayPause}
                    className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-lg transition-transform transform hover:scale-105"
                  >
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </button>
                </div>
              )}

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Progress Bar */}
                <div 
                  ref={progressBarRef}
                  className="mb-3 cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden hover:h-2 transition-all">
                    <div
                      className="h-full bg-blue-500 transition-all relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={handlePlayPause} className="text-white hover:text-blue-400 transition-colors">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    
                    <button onClick={handleSkipBackward} className="text-white hover:text-blue-400 transition-colors" title="Tua lùi 10s">
                      <SkipBack className="w-5 h-5" />
                    </button>

                    <button onClick={handleSkipForward} className="text-white hover:text-blue-400 transition-colors" title="Tua tiến 10s">
                      <SkipForward className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button onClick={handleVolumeToggle} className="text-white hover:text-blue-400 transition-colors">
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <span className="text-sm text-gray-300">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <button onClick={handleFullscreen} className="text-white hover:text-blue-400 transition-colors" title="Toàn màn hình">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 rounded-xl p-6 border border-blue-500/20">
              <h2 className="text-3xl font-bold text-blue-200 mb-4">{movie.video_title}</h2>
              <div className="flex items-center gap-4 text-gray-400 mb-4">
                {movie.created_at && (
                  <>
                    <span>{new Date(movie.created_at).getFullYear()}</span>
                    <span>•</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <span className="text-blue-400">📽️</span>
                  Video Streaming
                </span>
              </div>
              {movie.updated_at && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase">Thông tin</h3>
                  <p className="text-gray-300">
                    Ngày tải lên: {new Date(movie.created_at).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="text-gray-300">
                    Cập nhật lần cuối: {new Date(movie.updated_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all">
              Thêm vào danh sách
            </button>
            
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold border border-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tải {downloadProgress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Tải xuống</span>
                </>
              )}
            </button>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-semibold text-blue-300 mb-2">Hướng dẫn</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Click thanh tiến độ để tua</li>
                <li>• Phím mũi tên để tua ±10s</li>
                <li>• Space để phát/tạm dừng</li>
                <li>• F để toàn màn hình</li>
              </ul>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
};

export default XemPhim;