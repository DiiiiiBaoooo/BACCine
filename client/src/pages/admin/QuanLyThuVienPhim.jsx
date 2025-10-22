import React, { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { Plus, Upload, X, Play, Search, Film } from "lucide-react"

const QuanLyThuVienPhim = () => {
  const [videos, setVideos] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    videoTitle: "",
    folderName: "",
    posterImage: null,
    videoFile: null,
  })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/video")
        setVideos(res.data)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phim:", error)
      }
    }
    fetchVideos()
  }, [])

  const filteredVideos = videos.filter((video) =>
    video.video_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        posterImage: file,
      }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        videoFile: file,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.videoTitle || !formData.folderName || !formData.posterImage || !formData.videoFile) {
      alert("Vui lòng điền đầy đủ thông tin và chọn cả ảnh poster và file video")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("videoTitle", formData.videoTitle)
      uploadFormData.append("folderName", formData.folderName)
      uploadFormData.append("posterImage", formData.posterImage)
      uploadFormData.append("videoFile", formData.videoFile)

      const res = await axios.post("http://localhost:3000/api/video", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        }
      })

      if (res.status === 200) {
        alert("Thêm phim thành công!")
        setFormData({
          videoTitle: "",
          folderName: "",
          posterImage: null,
          videoFile: null,
        })
        setPreviewImage(null)
        setIsModalOpen(false)
        setUploadProgress(0)
        const fetchRes = await axios.get("http://localhost:3000/api/video")
        setVideos(fetchRes.data)
      } else {
        alert("Lỗi khi thêm phim")
      }
    } catch (error) {
      console.error("Lỗi:", error)
      alert(error.response?.data?.message || "Lỗi khi thêm phim")
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleWatch = (folderName) => {
    navigate(`/xem-phim/${folderName}`)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setPreviewImage(null)
    setUploadProgress(0)
    setFormData({
      videoTitle: "",
      folderName: "",
      posterImage: null,
      videoFile: null,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      {/* Header Section */}
      <div className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Thư viện phim
                </h1>
                <p className="text-slate-400 mt-2">Quản lý và xem phim yêu thích của bạn</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Plus size={20} />
                Thêm phim
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 py-2 bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm">Tổng số phim</p>
            <p className="text-3xl font-bold text-cyan-400 mt-2">{videos.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm">Phim tìm thấy</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{filteredVideos.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm">Trạng thái</p>
            <p className="text-3xl font-bold text-green-400 mt-2">Hoạt động</p>
          </div>
        </div>

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.video_id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-all duration-300 group backdrop-blur-sm"
              >
                <div className="relative aspect-video bg-slate-700 overflow-hidden">
                  <img
                    src={video.poster_image_url || "/placeholder.svg"}
                    alt={video.video_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <Play
                      size={40}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-white"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-sm font-semibold line-clamp-2 mb-3 text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {video.video_title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleWatch(video.s3_folder_name)}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs py-1 rounded flex items-center justify-center gap-1"
                    >
                      <Play size={14} />
                      Xem
                    </button>
                    <button
                      className="px-3 border border-slate-600 hover:bg-slate-700 text-slate-300 bg-transparent rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-slate-400 text-lg mb-6">
              {searchQuery ? "Không tìm thấy phim nào" : "Chưa có phim nào"}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Thêm phim đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Modal Thêm Phim */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header Modal */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Thêm phim mới
                </h2>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-700 rounded"
                  disabled={isLoading}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tên phim */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tên phim</label>
                  <input
                    type="text"
                    name="videoTitle"
                    value={formData.videoTitle}
                    onChange={handleInputChange}
                    placeholder="Nhập tên phim"
                    disabled={isLoading}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg py-2 px-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none disabled:opacity-50"
                  />
                </div>

                {/* Tên folder */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tên folder (S3)</label>
                  <input
                    type="text"
                    name="folderName"
                    value={formData.folderName}
                    onChange={handleInputChange}
                    placeholder="Nhập tên folder"
                    disabled={isLoading}
                    className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg py-2 px-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none disabled:opacity-50"
                  />
                </div>

                {/* Upload ảnh */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Ảnh poster</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-input"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="image-input"
                      className={`flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500 hover:bg-slate-700/30 transition bg-slate-700/20 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-center">
                        <Upload size={28} className="mx-auto mb-2 text-cyan-400" />
                        <p className="text-sm text-slate-300 font-medium">
                          {formData.posterImage ? formData.posterImage.name : "Chọn ảnh hoặc kéo thả"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF tối đa 10MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Preview ảnh */}
                  {previewImage && (
                    <div className="mt-4 relative aspect-video rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Upload video */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">File Video</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      id="video-input"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="video-input"
                      className={`flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500 hover:bg-slate-700/30 transition bg-slate-700/20 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-center">
                        <Film size={28} className="mx-auto mb-2 text-cyan-400" />
                        <p className="text-sm text-slate-300 font-medium">
                          {formData.videoFile ? formData.videoFile.name : "Chọn file video"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI tối đa 500MB</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Progress Bar */}
                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Đang xử lý...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isLoading}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Đang xử lý..." : "Thêm phim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuanLyThuVienPhim