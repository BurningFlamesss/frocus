import { transcribeWithElevenLabs } from "#/server/elevenlabs.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const formData = await request.formData();

                    const file = formData.get("file");
                    const languageCode = formData.get("languageCode")?.toString() ?? "ne";

                    if (!(file instanceof File)) {
                        return Response.json(
                            { error: "Audio file is required" },
                            { status: 400 }
                        );
                    }

                    const buffer = Buffer.from(await file.arrayBuffer());

                    const transcript = await transcribeWithElevenLabs({
                        buffer,
                        filename: file.name,
                        mimeType:
                            file.type || "audio/webm",
                        languageCode,
                    });

                    return Response.json({ transcript });
                } catch (error) {
                    console.error(error);

                    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
                }
            },
        },
    },
});