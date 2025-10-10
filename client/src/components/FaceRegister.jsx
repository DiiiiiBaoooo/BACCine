import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Button from './ui/Button';

const API_BASE_URL =  'http://localhost:3000/api';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'

const FaceRegister = () => {
  const { employeeId, cinemaClusterId } = useParams();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
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
      setError('Không thể tải mô hình nhận diện khuôn mặt. Vui lòng kiểm tra kết nối hoặc thư mục mô hình.');
      console.error('Model loading error:', err);
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    setError(null);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('Không tìm thấy khuôn mặt. Vui lòng đảm bảo khuôn mặt của bạn nằm trong khung hình.');
        setLoading(false);
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      console.log('Face descriptor captured:', descriptor);
      const response = await axios.post(`${API_BASE_URL}/schedule/employee/face/register`, {
        employee_id: employeeId,
        descriptor,
        image_url: null,
      });

      alert('Đăng ký khuôn mặt thành công!');
      navigate(`/employee/llv`);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi đăng ký khuôn mặt. Vui lòng thử lại.');
      console.error('Error registering face:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels().then(() => {
      if (!error) {
        startVideo();
      }
    });

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-semibold mb-4">Đăng ký khuôn mặt</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {!modelsLoaded && !error && (
        <div className="text-gray-600 text-sm mb-2">Đang tải mô hình nhận diện...</div>
      )}
      <video ref={videoRef} autoPlay muted className="w-full max-w-md mb-4" />
      <Button onClick={handleRegister} disabled={loading || !modelsLoaded} className="text-sm">
        {loading ? 'Đang đăng ký...' : modelsLoaded ? 'Đăng ký khuôn mặt' : 'Đang tải mô hình...'}
      </Button>
    </main>
  );
};

export default FaceRegister;