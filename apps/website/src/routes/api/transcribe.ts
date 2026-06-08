import { transcribeWithElevenLabs } from "#/server/elevenlabs.ts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
    server: {
        handlers: {
            GET: () => {
                return Response.json("Hello World")
            },
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
                    let transcript: string = "";

                    try {
                        transcript = await transcribeWithElevenLabs({
                            buffer,
                            filename: file.name,
                            mimeType: file.type || "audio/webm",
                            languageCode,
                        });
                    } catch (error) {
                        console.error("Error: (from inner block) ", error)
                    }

                    return Response.json({ transcript });
                } catch (error) {
                    console.error("Error: ", error);

                    return Response.json({ error: error instanceof Error ? error.message : `Unknown error ${JSON.stringify(error)}` }, { status: 500 });
                }
            },
        },
    },
});