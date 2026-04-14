import { useEffect, useState } from "react"
import API, { API_BASE } from "../api/api"
import { getToken } from "../utils/auth"
import StudentSidebar from "../components/StudentSidebar"
import { Calendar, MapPin, CheckCircle, Clock, ShieldAlert, ShieldCheck, QrCode } from "lucide-react"
import { useNavigate } from "react-router-dom"

function StudentVolunteer() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = getToken()

  useEffect(() => {
    API.get("/student/volunteer-events", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setEvents(res.data))
      .catch(err => console.log(err))
      .finally(() => setLoading(false))
  }, [])

  const pending = events.filter(e => e.status === "pending")
  const approved = events.filter(e => e.status === "approved")
  const rejected = events.filter(e => e.status === "rejected")

  const renderEventList = (list, title, Icon, colorClass) => {
    if (list.length === 0) return null

    return (
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon size={18} className={colorClass} />
          {title}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass.replace('text-', 'bg-').replace('500', '100')} ${colorClass}`}>{list.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map(event => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {event.event_poster ? (
                <img
                  src={`${API_BASE}/uploads/${event.event_poster}`}
                  className="w-full h-32 object-cover"
                  alt={event.event_title}
                />
              ) : (
                <div className={`w-full h-32 bg-gradient-to-br ${event.status === 'approved' ? 'from-emerald-400 to-teal-500' : 'from-gray-300 to-gray-400'} flex items-center justify-center`}>
                  <Calendar size={32} className="text-white/80" />
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{event.event_title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    event.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                    event.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {event.status}
                  </span>
                </div>

                <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                  <MapPin size={12} /> {event.event_venue}
                </p>
                {event.event_date && (
                  <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                    <Calendar size={12} /> {new Date(event.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}

                {event.status === "approved" && (
                  <button
                    onClick={() => navigate(`/scanner/${event.event_id}`)}
                    className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                  >
                    <QrCode size={16} /> Open Scanner
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <StudentSidebar />

      <div className="flex-1 p-10 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
          <p className="text-gray-500 mt-1">Track your volunteer applications and access event scanners</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              Loading volunteer events...
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-200">
            <ShieldAlert size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">No volunteer applications found</p>
            <p className="text-gray-400 text-sm mt-1">Apply for volunteer positions from the Discover Events page</p>
          </div>
        ) : (
          <>
            {renderEventList(approved, "Active Assignments", ShieldCheck, "text-emerald-500")}
            {renderEventList(pending, "Pending Applications", Clock, "text-amber-500")}
            {renderEventList(rejected, "Declined Applications", ShieldAlert, "text-red-500")}
          </>
        )}
      </div>
    </div>
  )
}

export default StudentVolunteer
