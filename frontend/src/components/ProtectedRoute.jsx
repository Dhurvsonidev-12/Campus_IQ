import { Navigate } from "react-router-dom"
import { getUserRole } from "../utils/auth"

function ProtectedRoute({children, role}){

 const userRole = getUserRole()

 if(!userRole){
  return <Navigate to="/login"/>
 }

 if(role && userRole !== role){
  return <Navigate to="/login"/>
 }

 return children
}

export default ProtectedRoute