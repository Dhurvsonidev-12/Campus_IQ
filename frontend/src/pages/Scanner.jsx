import { useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import API from "../api/api"

function Scanner() {

  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    )

    scanner.render(
      async (decodedText) => {

        const token = decodedText.replace("TICKET:", "")

        try {

          const res = await API.post("/scan-ticket", null, {
            params: { qr_token: token }
          })

          alert(res.data.message)

        } catch (err) {

          alert(err.response?.data?.detail || "Invalid Ticket")

        }

      },
      (error) => {
        console.log(error)
      }
    )

  }, [])

  return (

    <div className="p-10 text-center">

      <h1 className="text-3xl font-bold mb-6">
        QR Ticket Scanner
      </h1>

      <div id="reader" className="mx-auto w-96"></div>

    </div>

  )

}

export default Scanner