import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Camera, Shield, UserPlus } from 'lucide-react';

const API_BASE_URL = '/api';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const FaceRegister = () => {
  const { employeeId, cinemaClusterId } = useParams();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const loadModels = async () => {
    try {
      setError(null);
      console.log('Loading face-api.js models from:', MODEL_URL);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL).then(() => console.log('TinyFaceDetector loaded')),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL).then(() => console.log('FaceLandmark68Net loaded')),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL).then(() => console.log('FaceRecognitionNet loaded')),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      setError('Không thể tải mô hình nhận diện khuôn mặt. Vui lòng thử lại.');
      console.error('Model loading error:', err);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Không thể truy cập webcam. Vui lòng kiểm tra quyền truy cập camera.');
      console.error('Webcam error:', err);
    }
  };

  const handleRegister = async () => {
    if (!modelsLoaded) {
      setError('Mô hình nhận diện chưa tải xong. Vui lòng đợi.');
      return;
    }

    setLoading(true);
    setScanning(true);
    setError(null);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Không tìm thấy khuôn mặt. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung hình.');
        setLoading(false);
        setScanning(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      console.log('Face descriptor captured:', descriptor);
      
      const response = await axios.post(`${API_BASE_URL}/schedule/employee/face/register`, {
        employee_id: employeeId,
        descriptor,
        image_url: null,
      });

      setSuccess(true);

      setTimeout(() => {
        stopCamera();
        navigate(`/employee/llv`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi đăng ký khuôn mặt. Vui lòng thử lại.');
      console.error('Error registering face:', err.response?.data || err.message);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    loadModels().then(() => {
      if (!error) {
        startVideo();
      }
    });

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký khuôn mặt</h1>
          <p className="text-gray-600">Đăng ký sinh trắc học khuôn mặt để chấm công tự động</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            {/* Status Steps */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    modelsLoaded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {modelsLoaded ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className="text-sm text-gray-600">Khởi tạo</span>
              </div>
              <div className="w-12 h-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    scanning ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {scanning ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    '2'
                  )}
                </div>
                <span className="text-sm text-gray-600">Quét mặt</span>
              </div>
              <div className="w-12 h-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    success ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {success ? <CheckCircle className="w-5 h-5" /> : '3'}
                </div>
                <span className="text-sm text-gray-600">Hoàn tất</span>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-6">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

              {/* Overlay for scanning state */}
              {scanning && (
                <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 animate-spin text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">Đang quét khuôn mặt...</p>
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {success && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-semibold text-gray-900">Đăng ký thành công!</p>
                    <p className="text-sm text-gray-600">Đang chuyển hướng...</p>
                  </div>
                </div>
              )}

              {/* Face guide overlay */}
              {!scanning && !success && modelsLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-80 border-2 border-green-500/50 rounded-full" />
                </div>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 mb-4">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              </div>
            )}

            {!modelsLoaded && !error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 mb-4">
                <svg className="w-5 h-5 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-600">Đang tải mô hình nhận diện...</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-600" />
                Hướng dẫn đăng ký:
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Đảm bảo khuôn mặt của bạn nằm trong khung tròn</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Tìm nơi có ánh sáng tốt để hệ thống ghi nhận chính xác</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Nhìn thẳng vào camera và giữ yên trong vài giây</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>Sau khi đăng ký, bạn có thể chấm công bằng khuôn mặt</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={handleRegister}
              disabled={loading || !modelsLoaded || success}
              className={`w-full h-12 text-base font-medium rounded-lg flex items-center justify-center transition-colors ${
                loading || !modelsLoaded || success
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Đăng ký thành công
                </>
              ) : !modelsLoaded ? (
                <>
                  <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Đăng ký khuôn mặt
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Dữ liệu sinh trắc học được mã hóa và bảo mật tuyệt đối</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Bạn chỉ cần đăng ký khuôn mặt một lần duy nhất. Sau đó có thể sử dụng tính năng chấm công tự động.
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Gặp vấn đề?{' '}
            <button className="text-green-600 hover:underline">Liên hệ hỗ trợ</button>
          </p>
        </div>
      </div>
    </main>
  );
};

export default FaceRegister;