import { createServerFn } from "@tanstack/react-start";
import axios, { type AxiosError } from "axios";
import FormDataNode from "form-data";
import { z } from "zod";

const TranscribeInput = z.object({
    file: z.any(),
    mimeType: z.string().optional(),
    languageCode: z.string().optional(),
});

export interface TranscribeResult {
    transcript: string;
}

export const transcribeAudio = createServerFn({ method: "POST" })
    .validator(TranscribeInput)
    .handler(async ({ data }): Promise<TranscribeResult> => {
        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            throw new Error("ELEVENLABS_API_KEY is not configured");
        }

        const {
            file,
            mimeType = "audio/webm",
            languageCode = "ne",
        } = data;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const extension =
            mimeType.includes("ogg")
                ? "ogg"
                : mimeType.includes("mp4")
                    ? "mp4"
                    : "webm";

        const form = new FormDataNode();

        form.append("file", buffer, {
            filename: `recording.${extension}`,
            contentType: mimeType,
        });

        form.append("model_id", "scribe_v1");
        form.append("language_code", languageCode);

        try {
            const response = await axios.post<{ text: string }>(
                "https://api.elevenlabs.io/v1/speech-to-text",
                form,
                {
                    headers: {
                        "xi-api-key": apiKey,
                        ...form.getHeaders(),
                    },
                    timeout: 30000,
                    maxBodyLength: Infinity,
                },
            );

            return {
                transcript: response.data.text ?? "",
            };
        } catch (error) {
            const err = error as AxiosError<{ detail?: unknown }>;

            throw new Error(
                `[STT] ElevenLabs request failed: ${typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : JSON.stringify(err.response?.data?.detail)
                }`,
            );
        }
    });