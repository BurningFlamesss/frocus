import React, { useEffect, useRef, useState } from 'react'

function Block() {
    const [time, setTime] = useState<number>(0)
    const [isChallengeAccepted, setIsChallengeAccepted] = useState<boolean>(false)

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
                    ? null
                    : <button onClick={() => setIsChallengeAccepted(true)} type="button" className="p-4 cursor-pointer rounded-xl bg-green-200">
                        Accept the challenge
                    </button>
            }

        </main>
    )
}

export default Block