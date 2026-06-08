export async function uploadAudioForTranscription(
    file: File,
    languageCode = "ne",
) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("languageCode", languageCode);

    const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
    });

    const text = await response.text();

    // console.log("STATUS", response.status);
    // console.log("BODY", text);

    if (!response.ok) {
        throw new Error(text);
    }

    return JSON.parse(text);
}