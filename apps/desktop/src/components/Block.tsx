import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils';

function Block() {
    const [time, setTime] = useState<number>(0)
    const [isChallengeAccepted, setIsChallengeAccepted] = useState<boolean>(false)
    const video = useRef<HTMLVideoElement>(null)
    const canvas = useRef<HTMLCanvasElement>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
    const [isCaptured, setIsCaptured] = useState<boolean>(false)

    const startCamera = () => {

    }

    useEffect(() => {
        startCamera()
    }, [facingMode])

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(time => time + 1)
        }, 1000);
    }, [])

    return (
        <main className="h-dvh w-dvw flex flex-col items-center justify-center">
            <img className="h-48 w-48" src="/android-chrome-512x512.png" alt="" />
            You had spent huge time on scrolling YouTube. Now, take some rest for
            <h1>{time}s /300s</h1>
            <br />
            Or, Upload a photo of yourself touching some grass
            <br />
            {
                isChallengeAccepted
                    ? (
                        <>
                            <video ref={video} autoPlay playsInline className={cn("w-full h-full object-cover", isCaptured ? "hidden" : "block")} />
                            <canvas ref={canvas} className={cn("w-full h-full object-cover", isCaptured ? "block" : "hidden")} />
                        </>
                    )
                    : <button onClick={() => setIsChallengeAccepted(true)} type="button" className="p-4 cursor-pointer rounded-xl bg-green-200">
                        Accept the challenge
                    </button>
            }

        </main>
    )
}

export default Block