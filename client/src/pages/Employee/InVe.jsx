import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";

export default function InVePage() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const lastResultRef = useRef(null); // Tránh trùng lặp
  const timeoutRef = useRef(null); // Lưu timeout

  // Cleanup khi component unmount
  useEffect(() => {
    return () => stopScanning();
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);
      lastResultRef.current = null;

      // Khởi tạo reader với ưu tiên QR_CODE
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true); // Tăng độ nhạy quét
      codeReaderRef.current = new BrowserMultiFormatReader(hints);

      // Mở camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("[v0] Video srcObject assigned");
        // Đảm bảo video phát
        await videoRef.current.play().catch((err) => {
          console.error("[v0] Error playing video:", err);
          setError("Không thể phát video. Vui lòng kiểm tra quyền camera.");
          throw err;
        });

        // Chờ video sẵn sàng
        if (videoRef.current.readyState < videoRef.current.HAVE_ENOUGH_DATA) {
          console.log("[v0] Waiting for video data...");
          await new Promise((resolve) => {
            videoRef.current.onloadeddata = () => {
              console.log("[v0] Video data loaded");
              resolve();
            };
          });
        }
      }

      console.log("[v0] Starting QR scan...");

      // Thiết lập timeout 10 giây
      timeoutRef.current = setTimeout(() => {
        console.log("[v0] Scan timeout after 10 seconds");
        setError("Không tìm thấy mã QR trong 10 giây. Vui lòng thử lại.");
        stopScanning();
      }, 10000);

      // Bắt đầu quét QR
      codeReaderRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, err) => {
          try {
            if (result) {
              const text = result.getText();
              if (text && text !== lastResultRef.current) {
                lastResultRef.current = text;
                console.log("[v0] QR Detected:", text);
                handleQRDetected(text);
              }
            } else if (err && err.name !== "NotFoundException" && err.name !== "NotFoundException2") {
              console.error("[v0] Decode error:", err);
              setError("Không thể đọc mã QR. Hãy thử lại.");
              stopScanning();
            }
          } catch (e) {
            console.error("[v0] Lỗi không xác định trong decode:", e);
            setError("Lỗi không xác định khi quét. Vui lòng thử lại.");
            stopScanning();
          }
        }
      );
    } catch (err) {
      console.error("[v0] Camera error:", err);
      setError("Không thể truy cập camera. Kiểm tra quyền camera.");
      setScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    console.log("[v0] Stopping scanning...");
    // Làm sạch timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Dừng reader
    try {
      codeReaderRef.current?.reset?.();
    } catch (e) {
      console.warn("[v0] Error resetting reader:", e);
    }
    // Dừng camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log("[v0] Stopping track:", track);
        track.stop();
      });
    }
    // Làm sạch video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    streamRef.current = null;
    codeReaderRef.current = null;
    setScanning(false);
  };

  const handleQRDetected = (qrText) => {
    console.log("[v0] Handling QR detected:", qrText);
    stopScanning();
    setTimeout(() => {
      // Điều hướng trực tiếp đến URL trong mã QR
      window.location.href = qrText;
    }, 400);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      console.log("[v0] Manual code submitted:", manualCode.trim());
      // Giả sử mã thủ công là order_id, điều hướng đến URL dạng http://localhost:5173/inve/${orderId}
      window.location.href = `http://localhost:5173/inve/${manualCode.trim()}`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">In vé cho khách hàng</h1>
          <p className="text-gray-400">Quét mã QR hoặc nhập mã đơn hàng để in vé</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Scanner Section */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quét mã QR</h2>
                <p className="text-sm text-gray-400">Sử dụng camera để quét</p>
              </div>
            </div>

            {/* Camera View */}
            <div className="relative bg-black rounded-xl overflow-hidden mb-6 aspect-square">
              {scanning ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-4 border-red-500 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-400 rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-400 rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-400 rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-400 rounded-br-xl"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm bg-black/70 inline-block px-4 py-2 rounded-full">
                      Đang quét mã QR...
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Camera chưa được bật</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Scan Button */}
            {!scanning ? (
              <button
                onClick={startScanning}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Bắt đầu quét
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
              >
                Dừng quét
              </button>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nhập mã thủ công</h2>
                <p className="text-sm text-gray-400">Nếu không quét được QR</p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label htmlFor="orderCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Mã đơn hàng
                </label>
                <input
                  type="text"
                  id="orderCode"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã đơn hàng (VD: 123)"
                  className="w-full bg-black border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
              >
                Tìm và in vé
              </button>
            </form>

            {/* Quick Access */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-4">Truy cập nhanh (Demo)</p>
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3"].map((id) => (
                  <button
                    key={id}
                    onClick={() => window.location.href = `http://localhost:5173/inve/${id}`}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors text-sm font-medium"
                  >
                    Vé #{id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Hướng dẫn sử dụng
          </h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">1.</span>
              <span>Yêu cầu khách hàng xuất trình mã QR trên điện thoại hoặc email xác nhận</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">2.</span>
              <span>Nhấn "Bắt đầu quét" và đưa mã QR vào khung hình</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">3.</span>
              <span>Hệ thống sẽ tự động chuyển đến trang in vé sau khi quét thành công</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">4.</span>
              <span>Nếu không quét được, sử dụng chức năng nhập mã thủ công</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}