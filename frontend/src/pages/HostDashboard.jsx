import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import API from "../api/api"
import { getToken } from "../utils/auth"
import { Calendar, Users, IndianRupee, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"

function HostDashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = getToken()

  useEffect(() => {
    API.get("/host/events", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setEvents(res.data))
      .catch(err => console.log(err))
      .finally(() => setLoading(false))
  }, [])

  const totalEvents = events.length
  const totalRevenue = events.reduce((sum, e) => sum + (e.fee || 0), 0)
  const totalLimit = events.reduce((sum, e) => sum + (e.participant_limit || 0), 0)

  const stats = [
    { label: "Total Events", value: totalEvents, icon: <Calendar size={22} className="text-blue-500" />, bg: "bg-blue-50" },
    { label: "Total Capacity", value: totalLimit, icon: <Users size={22} className="text-green-500" />, bg: "bg-green-50" },
    { label: "Avg Entry Fee", value: totalEvents ? `₹${Math.round(totalRevenue / totalEvents)}` : "₹0", icon: <IndianRupee size={22} className="text-yellow-500" />, bg: "bg-yellow-50" },
    { label: "Active Events", value: totalEvents, icon: <TrendingUp size={22} className="text-purple-500" />, bg: "bg-purple-50" },
  ]

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-10 bg-gray-50 min-h-screen">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your events.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-5`}>
              <div className="mb-3">{stat.icon}</div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/create-event")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Create New Event
            </button>
            <button
              onClick={() => navigate("/manage-events")}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Manage Events
            </button>
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Events</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-dashed border-gray-300">
              <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No events created yet</p>
              <button
                onClick={() => navigate("/create-event")}
                className="mt-4 text-blue-600 font-medium hover:underline"
              >
                Create your first event →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.slice(0, 6).map(event => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <h3 className="font-semibold mb-1">{event.title}</h3>
                  <p className="text-gray-500 text-sm">📍 {event.venue}</p>
                  <p className="text-gray-500 text-sm">💰 ₹{event.fee}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default HostDashboard
