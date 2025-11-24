import { GoogleGenAI } from "@google/genai";

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getGeminiClient = (): GoogleGenAI => {
  // Always create a new client to ensure fresh API key usage
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Removes watermark from an image using Gemini 2.5 Flash Image.
 * We prompt the model to edit the image.
 */
export const removeImageWatermark = async (imageFile: File): Promise<string> => {
  const ai = getGeminiClient();
  const base64Data = await blobToBase64(imageFile);
  
  const model = 'gemini-2.5-flash-image';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: "Remove all watermarks, text, and logos overlaying this image. Restore the background seamlessly where the watermarks were removed. Return only the cleaned image."
          },
        ],
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data returned from the model.");

  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw error;
  }
};

/**
 * Generates a clean video using Veo.
 * Since direct "inpainting removal" isn't a standard API primitive for video yet,
 * we use the generation endpoint with the first frame as reference to "re-imagine" the video cleanly.
 */
export const generateCleanVideo = async (referenceImage: File, prompt: string): Promise<string> => {
    // Ensure API key is selected for Veo
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
    }

    const ai = getGeminiClient();
    const base64Data = await blobToBase64(referenceImage);

    // Using the fast preview model for better responsiveness in a demo
    const model = 'veo-3.1-fast-generate-preview';

    try {
        let operation = await ai.models.generateVideos({
            model,
            prompt: `High quality, clean video. ${prompt}. No watermarks, no text overlays, cinematic lighting.`,
            image: {
                imageBytes: base64Data,
                mimeType: referenceImage.type,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p', 
                aspectRatio: '16:9'
            }
        });

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!videoUri) {
            throw new Error("Video generation failed or returned no URI.");
        }

        // Fetch the actual video bytes using the proxy link + API key
        const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) throw new Error("Failed to download generated video.");
        
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Veo Video Error:", error);
        throw error;
    }
};
