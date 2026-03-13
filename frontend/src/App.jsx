import { BrowserRouter, Routes, Route } from "react-router-dom"

import Register from "./pages/Register"
import Login from "./pages/Login"
import Events from "./pages/Events"
import Scanner from "./pages/Scanner"
import ManageEvents from "./pages/ManageEvents"
import HostDashboard from "./pages/HostDashboard"
import CreateEvent from "./pages/CreateEvent"
import HostEvents from "./pages/HostEvents"
import Analytics from "./pages/Analytics"
import EditEvent from "./pages/EditEvent"
function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Auth */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Student */}
        <Route path="/events" element={<Events />} />

        {/* Volunteer */}
        <Route path="/scanner" element={<Scanner />} />

        {/* Host */}
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/create-event" element={<CreateEvent/>}/>
        <Route path="/host/events" element={<HostEvents />} />
        <Route path="/host/analytics" element={<Analytics />} />
        <Route path="/manage-events" element={<ManageEvents/>}/>
        <Route path="/edit-event/:id" element={<EditEvent/>}/>
      </Routes>

    </BrowserRouter>

  )
}

export default App