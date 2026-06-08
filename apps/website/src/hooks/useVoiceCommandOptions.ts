import { uploadAudioForTranscription } from "#/lib/transcribe.ts";
import { parseIntent } from "#/server/intent.ts";
import type { VoiceCommandContext, VoiceCommandResult, VoiceState } from "#/types/voice.ts";
import { useRef, useState } from "react";

export interface UseVoiceCommandOptions {
    context: VoiceCommandContext;
    onCommand?: (result: VoiceCommandResult) => void;
    onError?: (error: Error) => void;
    minConfidence?: number;
    maxDurationMs?: number;
}

export interface UseVoiceCommandReturn {
    state: VoiceState;
    isRecording: boolean;
    isProcessing: boolean;
    result: VoiceCommandResult | null;
    transcript: string | null;
    error: Error | null;
    start: () => Promise<void>;
    stop: () => void;
    reset: () => void;
}

export function useVoiceCommand({
    context,
    onCommand,
    onError,
    minConfidence = 0.70,
    maxDurationMs = 30_000
}: UseVoiceCommandOptions): UseVoiceCommandReturn {
    const [state, setState] = useState<VoiceState>("idle")
    const [result, setResult] = useState<VoiceCommandResult | null>(null)
    const [transcript, setTranscript] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Array<Blob>>([])
    const startTimeRef = useRef<number>(0)
    const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const stopStream = () => {
        streamRef.current?.getTracks().map((track) => track.stop())
        streamRef.current = null
    }

    const clearTimer = () => {
        if (maxTimerRef.current) {
            clearTimeout(maxTimerRef.current)
        }
        maxTimerRef.current = null
    }

    const fail = (error: Error) => {
        stopStream()
        clearTimer()
        setState("error")
        setError(error)
        onError?.(error)
    }

    const processBlob = async (
        blob: Blob,
        mimeType: string,
    ) => {
        if (blob.size === 0) {
            return fail(
                new Error(
                    "Recorded audio is empty.",
                ),
            );
        }

        setState("transcribing");

        const extension =
            mimeType.includes("ogg")
                ? "ogg"
                : "webm";

        const file = new File(
            [blob],
            `recording.${extension}`,
            {
                type: mimeType,
            },
        );

        let rawTranscript = "";

        try {
            const response =
                await uploadAudioForTranscription(
                    file,
                    context.language ?? "ne",
                );

            rawTranscript =
                response.transcript;

            setTranscript(rawTranscript);
        } catch (error) {
            return fail(error as Error);
        }

        if (!rawTranscript.trim()) {
            return fail(
                new Error(
                    "No speech detected.",
                ),
            );
        }

        setState("parsing");

        try {
            const { commands } =
                await parseIntent({
                    data: {
                        transcript:
                            rawTranscript,
                        context,
                    },
                });

            const gated = commands.map(
                (command) => {
                    if (
                        command.confidence <
                        minConfidence
                    ) {
                        return {
                            type:
                                "unknown" as const,
                            confidence:
                                command.confidence,
                            rawTranscript,
                        };
                    }

                    return command;
                },
            );

            const result: VoiceCommandResult =
            {
                command: gated,
                transcript:
                    rawTranscript,
                durationMs:
                    Date.now() -
                    startTimeRef.current,
            };

            setResult(result);
            setState("ready");

            onCommand?.(result);
        } catch (error) {
            return fail(error as Error);
        }
    };


    const start = async () => {
        if (state === "recording") {
            return
        }

        setError(null)
        setResult(null)
        setTranscript(null)
        chunksRef.current = []

        let stream: MediaStream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (err) {
            return fail(new Error("Microphone access denied. Please allow microphone permissions."))
        }

        streamRef.current = stream

        // mimeType list from google
        const SUPPORTED_MIME_TYPES = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
        ];

        const mimeType =
            SUPPORTED_MIME_TYPES.find((type) =>
                MediaRecorder.isTypeSupported(type),
            ) ?? "";

        const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream); mediaRecorderRef.current = recorder

        recorder.ondataavailable = event => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data)
            }
        }

        recorder.onstop = async () => {
            clearTimer();
            stopStream();

            if (
                chunksRef.current.length ===
                0
            ) {
                return fail(
                    new Error(
                        "No audio was captured.",
                    ),
                );
            }

            const blob = new Blob(
                chunksRef.current,
                {
                    type: mimeType,
                },
            );

            console.log({
                mimeType,
                chunks:
                    chunksRef.current.length,
                blobSize: blob.size,
            });

            await processBlob(
                blob,
                mimeType,
            );
        };


        recorder.onerror = (err) => {
            fail(new Error(`MediaRecorder:  ${err?.error.message}`))
        }

        recorder.start(250)

        startTimeRef.current = Date.now()
        setState("recording")

        maxTimerRef.current = setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop()
            }
        }, maxDurationMs)
    }

    const stop = () => {
        clearTimer();

        const recorder =
            mediaRecorderRef.current;

        if (!recorder) {
            return;
        }

        if (
            recorder.state ===
            "recording"
        ) {
            recorder.requestData();
            recorder.stop();
        }
    };

    const reset = () => {
        stop()
        stopStream()
        clearTimer()
        setError(null)
        setResult(null)
        setTranscript(null)
        setState("idle")
    }

    return {
        state,
        result,
        transcript,
        error,
        start,
        stop,
        reset,
        isProcessing: state === "transcribing" || state === "parsing",
        isRecording: state === "recording"
    }
}