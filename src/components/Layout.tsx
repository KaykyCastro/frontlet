import { useState } from "react"
import { Outlet } from "react-router-dom"
import Password from "./Password/Password"

export function Layout () {
    const [isOpen, setIsOpen] = useState(false)

    return(
        <>
        <Outlet context={{ openPassword: () => setIsOpen(true)}}/>

            {isOpen && (
                <Password onClose={() => setIsOpen(false)}/>
            )}
        </>
    )
}