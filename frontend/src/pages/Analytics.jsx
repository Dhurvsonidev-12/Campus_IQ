import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import API from "../api/api"
import { getToken } from "../utils/auth"
import { BarChart2, Users, IndianRupee, Calendar, TrendingUp, Ticket } from "lucide-react"

function Analytics() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
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
  const totalCapacity = events.reduce((sum, e) => sum + (e.participant_limit || 0), 0)
  const totalRevenuePotential = events.reduce((sum, e) => sum + ((e.fee || 0) * (e.participant_limit || 0)), 0)
  const freeEvents = events.filter(e => e.fee === 0).length
  const paidEvents = totalEvents - freeEvents

  const statCards = [
    {
      label: "Total Events",
      value: totalEvents,
      icon: <Calendar size={22} />,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      label: "Total Capacity",
      value: totalCapacity.toLocaleString(),
      icon: <Users size={22} />,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      label: "Max Revenue Potential",
      value: `₹${totalRevenuePotential.toLocaleString()}`,
      icon: <IndianRupee size={22} />,
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    },
    {
      label: "Paid Events",
      value: paidEvents,
      icon: <Ticket size={22} />,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "Free Events",
      value: freeEvents,
      icon: <TrendingUp size={22} />,
      color: "text-pink-600",
      bg: "bg-pink-50"
    },
    {
      label: "Avg Entry Fee",
      value: paidEvents > 0
        ? `₹${Math.round(events.filter(e => e.fee > 0).reduce((s, e) => s + e.fee, 0) / paidEvents)}`
        : "—",
      icon: <BarChart2 size={22} />,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
  ]

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-10 bg-gray-50 min-h-screen">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of all your event performance metrics</p>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading analytics...</p>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
              {statCards.map((stat) => (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-6`}>
                  <div className={`${stat.color} mb-3`}>{stat.icon}</div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">All Events Breakdown</h2>
              </div>

              {events.length === 0 ? (
                <p className="text-center py-10 text-gray-400">No events to analyze yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="text-left px-6 py-3">Event</th>
                      <th className="text-left px-6 py-3">Venue</th>
                      <th className="text-right px-6 py-3">Fee</th>
                      <th className="text-right px-6 py-3">Capacity</th>
                      <th className="text-right px-6 py-3">Max Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {events.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{event.title}</td>
                        <td className="px-6 py-4 text-gray-500">{event.venue}</td>
                        <td className="px-6 py-4 text-right">
                          {event.fee === 0
                            ? <span className="text-green-600 font-medium">Free</span>
                            : <span>₹{event.fee}</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">{event.participant_limit || "—"}</td>
                        <td className="px-6 py-4 text-right font-medium">
                          ₹{((event.fee || 0) * (event.participant_limit || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Analytics
