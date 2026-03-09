// Honestly this was primarily intorduced for input box dynamic 'enter' behavior. 
// If in future it is used elsewhere, remove this line.
import { useState, useEffect, useRef } from "react"

type InputModality = "touch" | "mouse" | "keyboard"

function hasTouchCapability(): boolean {
    if (typeof window === "undefined") return false
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches
    )
}

function getInitialModality(): InputModality {
    return hasTouchCapability() ? "touch" : "mouse"
}

export function useInputModality(): InputModality {
    const [modality, setModality] = useState<InputModality>(getInitialModality)
    const modalityRef = useRef(modality)
    modalityRef.current = modality

    useEffect(() => {
        const handlePointer = (e: PointerEvent) => {
            if (e.pointerType === "touch" || e.pointerType === "pen") {
                setModality("touch")
            } else if (e.pointerType === "mouse") {
                setModality("mouse")
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Modifier keys strongly indicate physical keyboard, regardless of current modality
            if (isModifierOnly(e)) {
                setModality("keyboard")
                return
            }

            // Non-modifier keys: only switch to keyboard if we're in mouse mode
            // This preserves touch mode on mobile devices with virtual keyboards
            if (modalityRef.current === "mouse") {
                setModality("keyboard")
            }
            // If modality is "touch", we stay in touch mode (virtual keyboard)
            // Even if a non-modifier key is pressed, it's likely from the virtual keyboard
        }

        window.addEventListener("pointerdown", handlePointer)
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            window.removeEventListener("pointerdown", handlePointer)
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    return modality
}

function isModifierOnly(e: KeyboardEvent): boolean {
    return ["Meta", "Control", "Alt", "Shift"].includes(e.key)
}