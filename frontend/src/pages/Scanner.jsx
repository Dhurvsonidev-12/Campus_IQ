import { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"
import API from "../api/api"
import { getToken, getUserRole } from "../utils/auth"
import { CheckCircle, XCircle, ScanLine, Zap, Users, ShieldCheck, Clock, ArrowLeft } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"

function Scanner() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(true)
  const [scanHistory, setScanHistory] = useState([])
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 })

  useEffect(() => {
    const token = getToken()

    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: 250,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    )

    scannerRef.current = scanner

    scanner.render(
      async (decodedText) => {
        scanner.pause()
        setScanning(false)

        const qrToken = decodedText.replace("TICKET:", "").trim()

        try {
          const res = await API.post("/scan-ticket", null, {
            params: { qr_token: qrToken },
            headers: { Authorization: `Bearer ${token}` }
          })
          const result = {
            success: true,
            message: res.data.message || "Ticket verified!",
            attendee: res.data.attendee_name,
            event: res.data.event_title,
            time: new Date().toLocaleTimeString()
          }
          setScanResult(result)
          setScanHistory(prev => [result, ...prev].slice(0, 20))
          setStats(prev => ({ ...prev, total: prev.total + 1, success: prev.success + 1 }))
        } catch (err) {
          const result = {
            success: false,
            message: err.response?.data?.detail || "Invalid or already used ticket",
            time: new Date().toLocaleTimeString()
          }
          setScanResult(result)
          setScanHistory(prev => [result, ...prev].slice(0, 20))
          setStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }))
        }
      },
      (error) => {
        console.debug(error)
      }
    )

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [])

  const resetScanner = () => {
    setScanResult(null)
    setScanning(true)
    if (scannerRef.current) {
      scannerRef.current.resume()
    }
  }

  const statCards = [
    { label: "Total Scans", value: stats.total, icon: <Zap size={18} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Successful", value: stats.success, icon: <ShieldCheck size={18} />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Failed", value: stats.failed, icon: <XCircle size={18} />, color: "text-red-500", bg: "bg-red-50" },
  ]

  const handleBack = () => {
    const role = getUserRole()
    if (role === "host") navigate("/host/events")
    else navigate("/student/volunteer")
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">QR Scanner</h1>
          <p className="text-xs text-gray-500">Event ID: {eventId}</p>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-500">Scan attendee tickets to verify and check them in</p>
        </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {statCards.map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4 transition-all duration-300`}>
                <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Scanner Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2.5 h-2.5 rounded-full ${scanning ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}></div>
                <h2 className="text-lg font-semibold">{scanning ? "Scanning..." : "Paused"}</h2>
              </div>

              <div id="reader" className="mx-auto rounded-lg overflow-hidden" />

              {/* Scan Result */}
              {scanResult && (
                <div className={`mt-5 p-5 rounded-xl border ${
                  scanResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`} style={{ animation: "slideUp 0.3s ease-out" }}>
                  <div className="flex items-center gap-3 mb-2">
                    {scanResult.success
                      ? <CheckCircle size={28} className="text-green-600" />
                      : <XCircle size={28} className="text-red-500" />
                    }
                    <div>
                      <p className={`font-semibold text-lg ${scanResult.success ? "text-green-700" : "text-red-600"}`}>
                        {scanResult.success ? "Valid Ticket!" : "Invalid Ticket"}
                      </p>
                      {scanResult.attendee && (
                        <p className="text-green-600 text-sm">Attendee: {scanResult.attendee}</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${scanResult.success ? "text-green-600" : "text-red-500"}`}>
                    {scanResult.message}
                  </p>
                  <button
                    onClick={resetScanner}
                    className="mt-4 bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors w-full"
                  >
                    Scan Next Ticket
                  </button>
                </div>
              )}
            </div>

            {/* Scan History Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Scan History
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{scanHistory.length}</span>
              </h2>

              {scanHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ScanLine size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No scans yet</p>
                  <p className="text-sm mt-1">Scan a QR code to see results here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {scanHistory.map((scan, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        scan.success
                          ? "bg-green-50/50 border-green-100"
                          : "bg-red-50/50 border-red-100"
                      }`}
                    >
                      {scan.success
                        ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        : <XCircle size={16} className="text-red-400 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {scan.attendee || scan.message}
                        </p>
                        {scan.event && (
                          <p className="text-xs text-gray-400 truncate">{scan.event}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{scan.time}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Scanner
