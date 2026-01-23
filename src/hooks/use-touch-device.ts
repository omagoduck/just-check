import * as React from "react"

export function useIsTouchDevice() {
    const [isTouchDevice, setIsTouchDevice] = React.useState<boolean>(false)

    React.useEffect(() => {
        const checkTouch = () => {
            // Check for touch pointer capability or touch points
            const hasTouchPointer = window.matchMedia("(any-pointer: coarse)").matches
            const hasTouchPoints = navigator.maxTouchPoints > 0
            // @ts-ignore - legacy touch event check
            const hasTouchEvents = "ontouchstart" in window

            setIsTouchDevice(hasTouchPointer || hasTouchPoints || hasTouchEvents)
        }

        checkTouch()

        const mql = window.matchMedia("(any-pointer: coarse)")
        mql.addEventListener("change", checkTouch)

        return () => mql.removeEventListener("change", checkTouch)
    }, [])

    return isTouchDevice
}
